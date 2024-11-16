from openai import OpenAI
import openai

client = OpenAI()
import base64
import mimetypes

client = OpenAI()
import json

def generate_structured_summary(raw_text, files, user_id, transaction_details):
    evidence_descriptions = []
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

Include any relevant information from the attached files.

Provide the JSON output only, with the following structure:
- "transaction_details": {{
    "transaction_name": "{transaction_details['transaction_name']}",
    "date_of_transaction": "{transaction_details['date']}",
    "amount": "",  # If available
    "merchant_name": "{transaction_details['merchant_name']}",
    "merchant_email": "{transaction_details['merchant_email']}",
    "transaction_id": "{transaction_details['transaction_id']}"
}},
- "claimant_information": {{
    "user_id": "{user_id}"
}},
- "issue_description": "",
- "dispute_category": "",
- "tracking_information": "",  # Include tracking numbers or shipping links if provided
- "evidence_provided": [...],  # List of evidence descriptions
- "desired_resolution": "",
- "additional_notes": ""

Claim Details:
\"\"\"
{raw_text}
\"\"\"

Evidence Descriptions:
{evidence_descriptions}
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
                "content": f"Please analyze the following image and provide a brief description relevant to the claim."
            })
            messages.append({
                "role": "user",
                "image": {"base64": image_base64, "mime_type": file_type}
            })
        elif file_type == 'application/pdf':
            # Extract text from PDF
            pdf_reader = PdfReader(file['filepath'])
            pdf_text = ""
            for page in pdf_reader.pages:
                pdf_text += page.extract_text()
            messages.append({
                "role": "user",
                "content": f"Please analyze the following PDF content and provide a brief description relevant to the claim.\n\nPDF Name: {file_name}\n\nPDF Content:\n\"\"\"\n{pdf_text}\n\"\"\""
            })

    # Call the OpenAI API
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=messages,
        max_tokens=1000,
        temperature=0.5,
    )

    structured_summary = response['choices'][0]['message']['content'].strip()
    try:
        structured_data = json.loads(structured_summary)
    except json.JSONDecodeError:
        structured_data = {}
    return structured_data


def shipping_expert_review(structured_data):
    prompt = f"""
You are a shipping expert reviewing a dispute claim.

Claim Data:
{json.dumps(structured_data, indent=2)}

Please determine if the shipping information indicates that the product is still in transit, delivered, or if there are any issues.

Provide your response in JSON format:
- "shipping_status": "",  # e.g., "In transit", "Delivered", "No tracking info"
- "action": "",  # e.g., "proceed_with_claim", "wait_for_delivery"
- "additional_info_needed": "",  # Any additional info needed from the user
"""

    response = client.completions.create(engine="gpt-4",
    prompt=prompt,
    max_tokens=200,
    temperature=0.5,
    n=1,
    stop=None)
    try:
        feedback = json.loads(response.choices[0].text.strip())
    except json.JSONDecodeError:
        feedback = {}
    return feedback

def chargeback_policies_expert_review(structured_data):
    prompt = f"""
You are an expert on credit card chargeback policies reviewing a dispute claim.

Claim Data:
{json.dumps(structured_data, indent=2)}

Please check if the claim meets the necessary criteria for a chargeback based on standard policies.

Provide your response in JSON format:
- "policy_compliance": "",  # e.g., "Compliant", "Non-compliant"
- "action": "",  # e.g., "proceed_with_claim", "additional_info_needed"
- "additional_info_needed": "",  # Any additional info needed from the user
"""

    response = client.completions.create(engine="gpt-4",
    prompt=prompt,
    max_tokens=200,
    temperature=0.5,
    n=1,
    stop=None)
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
- "decision": "",  # "approve", "reject", "human_review", or "wait"
- "rationale": ""
"""

    response = client.completions.create(engine="gpt-4",
    prompt=prompt,
    max_tokens=300,
    temperature=0.5,
    n=1,
    stop=None)
    try:
        adjudication_data = json.loads(response.choices[0].text.strip())
    except json.JSONDecodeError:
        adjudication_data = {}
    return adjudication_data
