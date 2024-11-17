import os
import base64

import requests

import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
from PyPDF2 import PdfReader
from openai import OpenAI
import uuid


client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Set up OpenAI API key
  # Ensure your API key is set in environment variables

def generate_structured_summary(claim, answers, files, transaction_details, additional_info=""):
    print(answers)
    messages = [
        {
            "role": "system",
            "content": "You are an assistant that helps to create a detailed structured summary of credit card dispute claims."
        },
        {
            "role": "user",
            "content": f"""
Please create a structured summary of the following claim details provided by the cardholder during an interactive session.

Please summarise or rephrase the following information in a structured format so that it is easier to process and analyze:

Include all relevant information from the attached evidence.

Provide the JSON output only, with the following structure:
- "transaction_details": {{
    "transaction_description": "{claim.transaction_description}",
    "date_of_transaction": "{claim.transaction_date}",
    "amount": "{claim.amount}",  # If available
    "merchant_email": "{claim.merchant_email}",
    "transaction_id": "{claim.transaction_id}"
    "user_id": "{uuid.uuid4()}",
    "issue_description": "",
    "dispute_category": "",  # E.g., "Item not received", "Item damaged", "Unauthorized transaction", "Other"
    "item_or_service": "", # E.g., "Physical goods", "Digital goods", "Services"
    "item_name": "",
    "have_contacted_seller": "",
    "tracking_number": "",  # Include tracking numbers or shipping links if provided
    "attachment_summary": "",  # Summarized description of each PDFs, images, or other files attached. Please be accurate more than anything else and do not hallucinate. Structure it in the format of "File Name: Description"
    "additional_notes": "",
    "additional_info_requests: "", # Any additional information requested of the customer}}

User Responses:
{json.dumps(answers, indent=2)}

Additional Information:
{additional_info}
"""
        }
    ]

    # Process files to generate evidence descriptions
    for file in files:
        file_type = file.get('type', '')
        file_name = file['name']
        if file_type.startswith('image/'):
            # Include the image in the messages
            image_base64 = base64.b64encode(file['data']).decode('utf-8')
            messages.append({
                "role": "user",
                "content": [{"type": "text", "text": f"Attached is an image file named {file_name}. Please analyze it and include any relevant details in the evidence summary."}, {
                "type": "image_url",
                "image_url": {
                "url":  f"data:image/jpeg;base64,{image_base64}",
                }}]})
        elif file_type == 'application/pdf':
            # Extract text from PDF
            pdf_text = ""
            try:
                pdf_reader = PdfReader(file['filepath'])
                for page in pdf_reader.pages:
                    pdf_text += page.extract_text()
            except Exception as e:
                pdf_text = "Could not extract text from PDF."

            messages.append({
                "role": "user",
                "content": f"Attached is a PDF document named {file_name}. Content:\n\"\"\"\n{pdf_text}\n\"\"\"\nPlease analyze it and include any relevant details in the evidence summary."
            })
        else:
            # Handle other file types if necessary
            messages.append({
                "role": "user",
                "content": f"Attached is a file named {file_name}. Please include any relevant details in the evidence summary."
            })

    # Add instruction to produce JSON output
    messages.append({
        "role": "assistant",
        "content": "Please provide the structured summary in JSON format as specified."
    })

    # Call the OpenAI API
    response = client.chat.completions.create(model="gpt-4o",
    messages=messages,
    max_tokens=1000,
    temperature=0.5,
    response_format={ "type": "json_object" })

    structured_summary = response.choices[0].message.content.strip()
    try:
        structured_data = json.loads(structured_summary)
        shipping_info = shipping_expert_review(messages, structured_data)
        structured_data["tracking_info"] = {"data": str(shipping_info)}
        print(structured_data   )
    except json.JSONDecodeError:
        structured_data = {}
    return structured_data

def chargeback_policies_expert_review(structured_data):
    prompt = f"""
You are an expert on credit card chargeback policies reviewing a dispute claim.

Claim Data:
{json.dumps(structured_data, indent=2)}

Based on the dispute category "{structured_data.get('dispute_category', '')}", evaluate the claim according to the following policies:

- **Item not received**: The customer must wait at least 10 days after the expected delivery date before filing a claim. If they have not waited the required time, the action should be "wait_for_shipping". However, this is only if there is evidence of the delivery date. If the delivery date is unknown this must be provided first through a request_for_information. If the expected delivery date is in additional_notes then it should not be asked for. 
- **Item damaged**: The customer should provide a description of the damage and evidence such as photos. The customer must provide proof of having attempted to contact the seller.
- **Unauthorized transaction**: The customer must report the unauthorized transaction within 60 days of the transaction date and must provide a detailed explanation of when they realized the transaction was unauthorized and why.
- **Order that is late but eventually arrived**: These orders are not eligible for a chargeback if the order eventually arrived.
- **Other**: The customer must provide a detailed explanation of the issue and any relevant evidence.

Determine if the claim complies with the policies. If not, specify what additional information is needed.

Provide your response in JSON format:
{{
    "action": ""  # "proceed_with_claim", "request_additional_info", "wait_for_shipping"
    "additional_info_needed": "",  # Any additional info needed from the user. If no additional info is needed or if additional info has been provided already, leave this field empty.
}}
"""
    messages = [{'role': 'system', 'content': prompt}]
    response = client.chat.completions.create(model="gpt-4o",
    messages=messages,
    max_tokens=300,
    response_format={ "type": "json_object" },
    temperature=0.5)
    try:
        feedback = json.loads(response.choices[0].message.content.strip())
    except json.JSONDecodeError:
        feedback = {}
    return feedback

def final_adjudication(structured_data, merchant_response, expert_feedback):
    prompt = f"""
You are an adjudicator tasked with making a decision on a credit card dispute claim.

Claim Data:
{json.dumps(structured_data, indent=2)}

Merchant Response:
\"\"\"
{merchant_response}
\"\"\"

Expert Feedback:
{json.dumps(expert_feedback, indent=2)}

Based on the above information, provide a decision and rationale.

Provide your response in JSON format:
{{
    "decision": "",  # "approve", "reject", "human_review", or "wait"
    "rationale": ""
}}
"""
    messages = [{'role': 'system', 'content': prompt}]
    response = client.chat.completions.create(model="gpt-4o",
    messages=messages,
    max_tokens=300,
    temperature=0.5)
    try:
        adjudication_data = json.loads(response.choices[0].message.content.strip())
    except json.JSONDecodeError:
        adjudication_data = {}
    return adjudication_data


def call_shipping_api(provider, tracking_number):
    """
    Simulates a shipping API call by returning data from a predefined dictionary.
    """
    # Mock database of tracking information for demonstration purposes

    # Lookup tracking information
    tracking_info =  {
                "current_date": "2024-11-17",
                "shipped": True,
                "delivered": False,
                "estimated_arrival": "2024-11-03"
            }
    
    if not tracking_info:
        return {"data": "", "error": f"No tracking information found for provider '{provider}' and tracking number '{tracking_number}'."}
    
    return tracking_info


def shipping_expert_review(messages, structured_data):
    """
    Extract tracking provider and tracking number from structured data,
    call the mock shipping API, and return the tracking data directly.
    """
    print("TRTYING SHIPIPING EXPERT REVIEW")
    # Step 1: Extract tracking details
    prompt = f"""
Extract the shipping provider and tracking number from the claim details below. If either is missing, specify "None".

Claim Data:
{json.dumps(structured_data, indent=2)} 

Provide your response in JSON format:
Tracking provider can be one of the following: "UPS", "FedEx", "USPS", "DHL", "Other". If there is no tracking number then return an empty JSON object.
{{
    "tracking_provider": "",
    "tracking_number": ""
}}
"""
    messages = [{'role': 'system', 'content': prompt}]
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        max_tokens=200,
        temperature=0.5,
        response_format={ "type": "json_object" })
    try:
        tracking_details = json.loads(response.choices[0].message.content.strip())
    except json.JSONDecodeError as e:
        print(e)
        tracking_details = {"tracking_provider": None, "tracking_number": None}

    provider = tracking_details.get("tracking_provider")
    tracking_number = tracking_details.get("tracking_number")
    
    # Step 2: Validate extracted details
    if not provider or not tracking_number or provider.lower() not in ["ups", "fedex", "usps", "dhl", "other"]:
        return {"data": "", "error": "Tracking provider and tracking number is missing."}

    if not provider:
        return {"data": "", "error": "Tracking provider is missing."}

    if not tracking_number:
        return {"data": "", "error": "Tracking number is missing."}

    # Step 3: Call the mock shipping API
    tracking_info = call_shipping_api(provider, tracking_number)
    if not tracking_info or "error" in tracking_info:
        return {"data": "", "error": "Unable to retrieve shipping information from the tracking API."}

    shipped = "Yes" if tracking_info["shipped"] else "No"
    delivered = "Yes" if tracking_info["delivered"] else "No"
    estimated_arrival = tracking_info["estimated_arrival"] or "Unknown"
    current_date = tracking_info["current_date"]

    formatted_info = (
        f"Shipping Info:\n"
        f"- Provider: {provider}\n"
        f"- Tracking Number: {tracking_number}\n"
        f"- Shipped: {shipped}\n"
        f"- Delivered: {delivered}\n"
        f"- Estimated Arrival: {estimated_arrival}\n"
        f"- Current Date: {current_date}"
    )
    
    print(formatted_info)
    
    return formatted_info