import os
import base64
import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
from PyPDF2 import PdfReader
from openai import OpenAI
from openai import OpenAI

client = OpenAI()

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Set up OpenAI API key
  # Ensure your API key is set in environment variables

def generate_structured_summary(answers, files, user_id, transaction_details):
    messages = [
        {
            "role": "system",
            "content": "You are an assistant that helps to create a detailed structured summary of credit card dispute claims."
        },
        {
            "role": "user",
            "content": f"""
Please create a structured summary of the following claim details provided by the cardholder during an interactive session.

Ensure that all sensitive personal information is anonymized or omitted.

Include any relevant information from the attached evidence.

Provide the JSON output only, with the following structure:
- "transaction_details": {{
    "transaction_name": "{transaction_details.get('transaction_name', '')}",
    "date_of_transaction": "{transaction_details.get('date', '')}",
    "amount": "",  # If available
    "merchant_name": "{transaction_details.get('merchant_name', '')}",
    "merchant_email": "{transaction_details.get('merchant_email', '')}",
    "transaction_id": "{transaction_details.get('transaction_id', '')}"
}},
- "claimant_information": {{
    "user_id": "{user_id}"
}},
- "issue_description": "",
- "dispute_category": "",  # E.g., "Item not received", "Item damaged", "Unauthorized transaction", "Other"
- "item_or_service": "",
- "item_name": "",
- "have_contacted_seller": "",
- "tracking_information": "",  # Include tracking numbers or shipping links if provided
- "evidence_summary": "",  # Summarized description of the evidence provided
- "desired_resolution": "",
- "additional_notes": ""

User Responses:
{json.dumps(answers, indent=2)}
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
                "content": f"Attached is an image file named {file_name}. Please analyze it and include any relevant details in the evidence summary."
            })
            # Attach the image as base64
            messages.append({
                "role": "user",
                "content": f"Image base64 data: {image_base64}"
            })
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
    except json.JSONDecodeError:
        structured_data = {}
    return structured_data

def chargeback_policies_expert_review(structured_data):
    prompt = f"""
You are an expert on credit card chargeback policies reviewing a dispute claim.

Claim Data:
{json.dumps(structured_data, indent=2)}

Based on the dispute category "{structured_data.get('dispute_category', '')}", evaluate the claim according to the following policies:

- **Item not received**: The customer must wait at least 15 days after the expected delivery date before filing a claim. Tracking information should indicate non-delivery.
- **Item damaged**: The customer should provide a description of the damage and evidence such as photos.
- **Unauthorized transaction**: The customer must report the unauthorized transaction within 60 days of the transaction date.

Determine if the claim complies with the policies. If not, specify what additional information is needed.

Provide your response in JSON format:
{{
    "policy_compliance": "",  # "Compliant" or "Non-compliant"
    "additional_info_needed": "",  # Any additional info needed from the user
    "action": ""  # "proceed_with_claim", "request_additional_info", "reject_claim"
}}
"""

    response = client.completions.create(engine="gpt-4",
    prompt=prompt,
    max_tokens=300,
    temperature=0.5)
    try:
        feedback = json.loads(response.choices[0].text.strip())
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

    response = client.completions.create(engine="gpt-4o",
    prompt=prompt,
    max_tokens=300,
    temperature=0.5)
    try:
        adjudication_data = json.loads(response.choices[0].text.strip())
    except json.JSONDecodeError:
        adjudication_data = {}
    return adjudication_data
def shipping_expert_review(structured_data):
    prompt = f"""
You are a shipping expert reviewing a dispute claim.

Claim Data:
{json.dumps(structured_data, indent=2)}

Based on the dispute category "{structured_data.get('dispute_category', '')}", please determine if all necessary information is provided.

- For "Item not received", check if tracking information is available.
- For "Item damaged", check if a description of the damage and evidence (e.g., photos) are provided.
- For "Unauthorized transaction", check if the user has provided details about when they realized the transaction was unauthorized.

If any required information is missing, specify what is needed.

Provide your response in JSON format:
{{
    "additional_info_needed": "",  # Describe any additional info needed from the user
    "action": ""  # "proceed_with_claim", "request_additional_info"
}}
"""

    response = client.completions.create(engine="gpt-4",
    prompt=prompt,
    max_tokens=300,
    temperature=0.5)
    try:
        feedback = json.loads(response.choices[0].text.strip())
    except json.JSONDecodeError:
        feedback = {}
    return feedback