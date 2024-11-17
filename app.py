import os
os.environ['EVENTLET_HUB'] = 'poll'

import eventlet
eventlet.monkey_patch()

import uuid 

from openai import OpenAI

from flask import jsonify
from datetime import datetime, timedelta
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
from flask import Flask, render_template, request, session, redirect, url_for, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room, leave_room
from utils.llm_utils import (
    generate_structured_summary,
    shipping_expert_review,
    chargeback_policies_expert_review,
    final_adjudication
)
from email.mime.text import MIMEText
import threading
import base64
import json
from datetime import datetime
import mimetypes

from enum import Enum
from flask_cors import CORS

app = Flask(__name__)
CORS(app, supports_credentials=True)

app.config['SECRET_KEY'] = 'your-secret-key'  # Replace with your actual secret key
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///claims.db'
app.config['UPLOAD_FOLDER'] = 'uploaded_files'
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])
db = SQLAlchemy(app)
socketio = SocketIO(app, manage_session=False, max_http_buffer_size=100000000, cors_allowed_origins='*')

suhas_mode = False

# Define Claim States
class ClaimState(Enum):
    START = 'START'
    COLLECTING_INFO = 'COLLECTING_INFO'
    UPLOADING_EVIDENCE = 'UPLOADING_EVIDENCE'
    ADDITIONAL_INFO = 'ADDITIONAL_INFO'
    FINALIZING = 'FINALIZING'
    COMPLETED = 'COMPLETED'

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_uuid = db.Column(db.String(100), unique=True)
    claims = db.relationship('Claim', backref='user', lazy=True)

class Claim(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    raw_text = db.Column(db.Text)
    structured_data = db.Column(db.Text)
    status = db.Column(db.String(50))
    state = db.Column(db.String(50), default=ClaimState.START.value)
    additional_info = db.Column(db.Text)
    adjudication_result = db.Column(db.Text)
    expert_feedback = db.Column(db.Text)
    merchant_response = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    messages = db.relationship('Message', backref='claim', lazy=True)
    files = db.relationship('File', backref='claim', lazy=True)
    chat_locked = db.Column(db.Boolean, default=False)
    current_question = db.Column(db.String(50))  # To track the current question
    claim_summary = db.Column(db.Text)
    answers = db.Column(db.Text)  # New field to store answers as JSON
    question_index = db.Column(db.Integer)  # New field to store current question index

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    claim_id = db.Column(db.Integer, db.ForeignKey('claim.id'))
    sender = db.Column(db.String(50))  # 'user', 'assistant', or 'merchant'
    content = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class File(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    claim_id = db.Column(db.Integer, db.ForeignKey('claim.id'))
    filename = db.Column(db.String(200))
    filepath = db.Column(db.String(500))
    filetype = db.Column(db.String(50))
    description = db.Column(db.Text)

with app.app_context():
    db.create_all()

# Define the required fields for the claim
required_fields = [
    {'id': 'issue_description', 'question': 'Please describe the issue you are experiencing.', 'field': 'issue_description', 'options': ['Item not received', 'Item damaged', 'Unauthorized transaction', 'Other']},
    {'id': 'item_or_service', 'question': 'Is the dispute about an item or a service?', 'field': 'item_or_service', 'options': ['Item', 'Service']},
    {'id': 'item_name', 'question': 'Please provide the name of the item or service.', 'field': 'item_name'},
    {'id': 'have_contacted_seller', 'question': 'Have you contacted the merchant about this issue?', 'field': 'have_contacted_seller', 'options': ['Yes', 'No']},
    {'id': 'shipping_info', 'question': 'Please provide any shipping information (tracking number or shipping link) if available.', 'field': 'shipping_info', 'optional': True, 'condition': 'The item is not a service and the issue is that the item was not received.'},
]

@app.before_request
def load_user():
    user_uuid = session.get('user_uuid')
    if not user_uuid:
        # No user UUID in session, create a new user
        user_uuid = str(uuid.uuid4())
        session['user_uuid'] = user_uuid
        # Create a new user in the database
        user = User(user_uuid=user_uuid)
        db.session.add(user)
        db.session.commit()
    else:
        # User UUID exists, retrieve the user
        user = User.query.filter_by(user_uuid=user_uuid).with_for_update().first()
        if not user:
            # User not found in database, create a new user
            user = User(user_uuid=user_uuid)
            db.session.add(user)
            db.session.commit()

@app.route('/login/<user_uuid>')
def login(user_uuid):
    # Check if the user exists
    user = User.query.filter_by(user_uuid=user_uuid).with_for_update().first()
    if user:
        # Set the user_uuid in the session
        session['user_uuid'] = user_uuid
        return redirect(url_for('index'))
    else:
        # User not found, create a new user
        user = User(user_uuid=user_uuid)
        db.session.add(user)
        db.session.commit()
        session['user_uuid'] = user_uuid
        return redirect(url_for('index'))

@app.route('/')
def index():
    user_uuid = session.get('user_uuid')
    user = User.query.filter_by(user_uuid=user_uuid).with_for_update().first()
    if not user:
        return redirect(url_for('load_user'))

    # Retrieve the user's claims
    claims = Claim.query.filter_by(user_id=user.id).all()

    # For testing purposes, we're using hardcoded transaction details
    # In a real application, these would be provided based on user selection
    transaction_details = {
        'transaction_name': 'Purchase at ABC Store',
        'date': '2023-10-15',
        'amount': '$100.00',
        'merchant_name': 'ABC Store',
        'merchant_email': 'merchant@example.com',
        'transaction_id': 'TX1234567890'
    }

    return render_template('index.html', transaction_details=transaction_details, claims=claims)

@app.route('/start_new_claim')
def start_new_claim():
    session.pop('current_claim_id', None)
    # Create a new claim and redirect to its chat window
    user_uuid = session.get('user_uuid')
    user = User.query.filter_by(user_uuid=user_uuid).with_for_update().first()
    if not user:
        return redirect(url_for('load_user'))

    # Create a new claim
    claim = Claim(user_id=user.id, status='In Progress', state=ClaimState.START.value)
    db.session.add(claim)
    db.session.commit()
    
    session['transaction_details'] = {
        'transaction_name': 'Purchase at ABC Store',
        'date': '2023-10-15',
        'amount': '$100.00',
        'merchant_name': 'ABC Store',
        'merchant_email': 'merchant@example.com',
        'transaction_id': 'TX1234567890'
    }

    # Redirect to the claim chat window
    if suhas_mode:
        return redirect(url_for('view_claim', claim_id=claim.id))
    else:
        return jsonify({'id': claim.id})

@app.route('/claim/<int:claim_id>')
def view_claim(claim_id):
    user_uuid = session.get('user_uuid')
    user = User.query.filter_by(user_uuid=user_uuid).with_for_update().first()
    if not user:
        return redirect(url_for('load_user'))

    # Get the claim
    claim = Claim.query.filter_by(id=claim_id).with_for_update().first()
    
    if not claim:
        return 'Claim not found or you do not have access to it.', 404

    # Determine if chat is locked
    chat_locked = claim.chat_locked

    session['current_claim_id'] = claim.id

    return render_template('view_claim.html', claim=claim, chat_locked=chat_locked)

@app.route('/get_messages/<int:claim_id>', methods=['GET'])
def get_messages(claim_id):
    user_uuid = session.get('user_uuid')
    user = User.query.filter_by(user_uuid=user_uuid).with_for_update().first()
    claim = Claim.query.filter_by(id=claim_id).with_for_update().first()
    print(claim_id)
    print(claim.messages)
    if not claim:
        return jsonify({'error': 'Unauthorized access or claim not found.'}), 403

    messages = Message.query.filter_by(claim_id=claim_id).order_by(Message.timestamp).all()
    messages_list = [{'sender': msg.sender, 'content': msg.content, 'timestamp': msg.timestamp.isoformat()} for msg in messages]
    # check if message was created in the last 5 seconds, if so, exclude
    #if messages_list and datetime.fromisoformat(messages_list[-1]['timestamp']) > datetime.now() - timedelta(seconds=5):
        #messages_list = []
    return jsonify({'messages': messages_list, 'claim_summary': claim.claim_summary})

@socketio.on('get_all_messages')
def get_all_messages():
    claim_id = session.get('current_claim_id')
    if not claim_id:
        return
    
    user_uuid = session.get('user_uuid')
    
    claim = Claim.query.filter_by(id=claim_id).with_for_update().first()
    for message in claim.messages:
        emit('message', {'text': message.content})

@socketio.on('connect')
def handle_connect():
    session_id = request.sid
    user_uuid = session.get('user_uuid')
    # Get the current claim ID from the session
    # claim_id = session.get('current_claim_id')
    print('----')
        # No claim in session; do nothing
    claim_id = request.args.get('claimId')

    claim = Claim.query.filter_by(id=claim_id).with_for_update().first()
    if not claim:
        # Claim not found; do nothing
        return

    # Get transaction details from the client (if needed)
    transaction_details = session.get('transaction_details')
    if not transaction_details:
        # For testing, use default transaction details
        transaction_details = {
            'transaction_name': 'Purchase at ABC Store',
            'date': '2023-10-15',
            'merchant_name': 'ABC Store',
            'merchant_email': 'merchant@example.com',
            'transaction_id': 'TX1234567890'
        }

    # If the claim is already completed, do not ask questions

        
    if claim.state == ClaimState.COMPLETED.value:
        emit("message", {"text": "This claim has already been submitted and is awaiting further action."})
        return

 
    # If there is a current question, resume from there
    print(claim)
    if claim.current_question:
        ask_next_question(claim)
    else:
        # Start the conversation
        print('Starting Conversation')
        start_conversation(claim, transaction_details)

def start_conversation(claim, transaction_details):
    print(claim.id)
    # Only send initial messages if this is a new claim (no messages exist)
    if not claim.messages:
        transaction_info = f"""
You are disputing the following transaction:

- **Transaction Name**: {transaction_details['transaction_name']}
- **Date**: {transaction_details['date']}
- **Merchant Name**: {transaction_details['merchant_name']}
- **Merchant Email**: {transaction_details['merchant_email']}
- **Transaction ID**: {transaction_details['transaction_id']}

"""
        emit('message', {'text': transaction_info})
        emit('message', {'text': 'Let\'s proceed to gather more information about your dispute.'})

        # Save assistant messages
        message1 = Message(claim_id=claim.id, sender='assistant', content=transaction_info)
        message2 = Message(claim_id=claim.id, sender='assistant', content='Let\'s proceed to gather more information about your dispute.')
        db.session.add(message1)
        db.session.add(message2)
        db.session.commit()

    # Initialize answers

    print(claim.answers is None)
    if not claim.answers:
        claim.answers = json.dumps({})
        db.session.commit()
        print("comitting")

    # Start asking questions
    if claim.question_index is None:
        claim.question_index = 0
        db.session.commit()

    ask_next_question(claim)

def is_question_redundant(claim, field):
    # Check if the question is not relevant based on previous answers
    answers = json.loads(claim.answers)
                
    # Check if the question has already been answered in previous responses
    # Fetch previous messages
    messages_db = Message.query.filter_by(claim_id=claim.id).order_by(Message.timestamp).all()
    # Get the question text
    question = field['question']
    # Build the conversation history
    conversation = []
    for msg in messages_db:
        role = 'assistant' if msg.sender == 'assistant' else 'user'
        conversation.append({'role': role, 'content': msg.content})
    # Add system prompt
    system_prompt = "You are an assistant helping to determine if the user's previous responses have already answered a specific question in a credit card chargeback process."
    messages = [{'role': 'system', 'content': system_prompt}]
    # Add the conversation history
    messages.extend(conversation)
    # Add the final assistant prompt
    assistant_prompt = f"Has the user already provided enough information to answer the following question: '{question}'? Respond with 'Yes' or 'No' in JSON format: {{\"answered\": \"Yes\" or \"No\"}}"
    
    condition = field.get('condition')
    if condition:
        condition_messages = messages.copy()
        condition_prompt = "Please answer in JSON format whether the condition is true based on the previous messages: {'answer': true} \n" + condition
        condition_messages.append({'role': 'assistant', 'content': condition_prompt})
        # evaluate if the condition is met
        try:
            response = client.chat.completions.create(model="gpt-4o",
            messages=condition_messages,
            max_tokens=50,
            temperature=0.0,
            response_format={ "type": "json_object" })
            result = json.loads(response.choices[0].message.content.strip())
            condition_met = result.get('answer', True)
        except Exception as e:
            print(f"Error in is_question_redundant: {e}")
            condition_met = True
        
        if not condition_met:
            return True
        
    messages.append({'role': 'assistant', 'content': assistant_prompt})
    # Call GPT-4 API
    try:
        response = client.chat.completions.create(model="gpt-4o",
        messages=messages,
        max_tokens=50,
        temperature=0.0,
        response_format={ "type": "json_object" })
        assistant_reply = response.choices[0].message.content.strip()
        result = json.loads(assistant_reply)
        answered = result.get('answered', 'No')
        if answered.lower() == 'yes':
            # Try to extract the answer
            extracted_answer = extract_answer(claim, question)
            if extracted_answer:
                # Save the extracted answer
                answers[field['id']] = extracted_answer
                claim.answers = json.dumps(answers)
                db.session.commit()
            return True
        else:
            return False
    except Exception as e:
        print(f"Error in is_question_redundant: {e}")
        return False

def extract_answer(claim, question_text):
    # Fetch previous messages
    messages_db = Message.query.filter_by(claim_id=claim.id).order_by(Message.timestamp).all()

    # Build the conversation history
    conversation = []
    for msg in messages_db:
        role = 'assistant' if msg.sender == 'assistant' else 'user'
        conversation.append({'role': role, 'content': msg.content})

    # Add system prompt
    system_prompt = "You are an assistant helping to extract the user's answer to a specific question from the conversation history."
    messages = [{'role': 'system', 'content': system_prompt}]

    # Add the conversation history
    messages.extend(conversation)

    # Add the final assistant prompt
    assistant_prompt = f"Please extract the user's answer to the following question: '{question_text}'. Provide the answer in JSON format: {{\"answer\": \"User's answer here\"}}"
    messages.append({'role': 'assistant', 'content': assistant_prompt})

    # Call GPT-4 API
    try:
        response = client.chat.completions.create(model="gpt-4o",
        messages=messages,
        max_tokens=150,
        temperature=0.0,
        response_format={ "type": "json_object" })
        assistant_reply = response.choices[0].message.content.strip()
        result = json.loads(assistant_reply)
        answer = result.get('answer', '')
        return answer
    except Exception as e:
        print(f"Error in extract_answer: {e}")
        return None

def ask_next_question(claim):
    answers = json.loads(claim.answers)
    question_index = claim.question_index or 0

    # Find the next required field that hasn't been answered
    while question_index < len(required_fields):
        field = required_fields[question_index]
        field_id = field['id']
        if field_id not in answers:
            # Check if the question is redundant
            if is_question_redundant(claim, field):
                # The question is redundant; skip it
                question_index += 1
                claim.question_index = question_index
                db.session.commit()
                continue  # Proceed to the next question
            else:
                # Ask this question
                
                if field['question'] == claim.messages[-1].content:
                    return
                
                emit('message', {'text': field['question']})

                # Save assistant message
                message = Message(claim_id=claim.id, sender='assistant', content=field['question'])
                db.session.add(message)
                db.session.commit()

                # Update the claim's current question and question index
                claim.current_question = field_id
                claim.question_index = question_index
                db.session.commit()
                return
        else:
            question_index += 1

    # All required fields have been answered
    # Proceed to evidence upload
    claim.current_question = 'evidence_available'
    db.session.commit()
    emit('message', {'text': 'Please upload any evidence files that support your claim. If there is no relevant evidence or when you are done uploading, type "Done".'})


@socketio.on('user_response')
def handle_user_response(data):
    session_id = request.sid
    user_uuid = session.get('user_uuid')
    user = User.query.filter_by(user_uuid=user_uuid).with_for_update().first()
    claim_id = data.get('claim_id')

    claim = Claim.query.filter_by(id=claim_id).with_for_update().first()
    if not claim:
        return

    # Check if the chat is locked
    if claim.state == ClaimState.COMPLETED.value:
        emit('message', {'text': 'This claim has already been submitted and is awaiting further action.'})
        return
    
    current_question = claim.current_question
    user_response = data.get('text')

    
    if claim.state == ClaimState.ADDITIONAL_INFO.value:
        emit('message', {'text': 'Thank you for providing additional information. We will review the information and get back to you.'})
        # Save message to database
        message = Message(claim_id=claim.id, sender='user', content=user_response)
        claim.additional_info = user_response
        db.session.add(message)
        db.session.commit()
        create_claim()
        return

    # Save message to database
    message = Message(claim_id=claim.id, sender='user', content=user_response)
    db.session.add(message)
    db.session.commit()
    
    
    # Load existing answers
    answers = json.loads(claim.answers)

    # Save the user's response
    answers[current_question] = user_response
    claim.answers = json.dumps(answers)
    db.session.commit()

    
    if claim.question_index is None:
        emit('message', {'text': 'Please wait for the claim to be processed.'})
    # Validate the response with GPT-4
    if claim.question_index > len(required_fields) - 1:
        if current_question == 'evidence_available' and 'done' in user_response.lower():
            create_claim()
            return
        else:
            emit('message', {'text': 'Please upload any evidence files that support your claim. If there is no relevant evidence or when you are done uploading, type "Done".'})
    
    field = required_fields[claim.question_index]
    validation_result = validate_response_with_gpt4(claim.id, field['question'], user_response)

    if validation_result['valid'] or field.get('optional', False):
        # Move to the next question
        claim.question_index += 1
        claim.current_question = None
        db.session.commit()
        ask_next_question(claim)
    else:
        # Ask for clarification
        clarification = validation_result['clarification']
        emit('message', {'text': clarification})

        # Save assistant's message
        assistant_message = Message(claim_id=claim.id, sender='assistant', content=clarification)
        db.session.add(assistant_message)
        db.session.commit()

    answers = json.loads(claim.answers)
    transaction_details = session.get('transaction_details', {})

    # Get files associated with the claim
    files = []
    file_records = File.query.filter_by(claim_id=claim.id).all()
    for file_record in file_records:
        with open(file_record.filepath, 'rb') as f:
            file_data = f.read()
            files.append({
                'name': file_record.filename,
                'data': file_data,
                'type': file_record.filetype,
                'filepath': file_record.filepath  # Include filepath for PDF processing
            })
            
    structured_data = generate_structured_summary(answers, files, transaction_details, claim.additional_info)
    claim.structured_data = json.dumps(structured_data)
    db.session.commit()
    emit('update_claim_summary', {'claim_summary': structured_data})

def validate_response_with_gpt4(claim_id, question_text, user_response):
    # Fetch previous messages
    messages_db = Message.query.filter_by(claim_id=claim_id).order_by(Message.timestamp.desc()).limit(5).all()
    # Reverse to get the correct order
    messages_db.reverse()

    # Build the conversation history
    messages = []
    for msg in messages_db:
        role = 'assistant' if msg.sender == 'assistant' else 'user'
        messages.append({'role': role, 'content': msg.content})

    # Add the current question and user response
    messages.append({'role': 'assistant', 'content': question_text})
    messages.append({'role': 'user', 'content': user_response})

    # Add system prompt
    system_prompt = "You are an assistant helping to validate user responses to a predefined question in a credit card chargeback process."
    messages.insert(0, {'role': 'system', 'content': system_prompt})

    # Add instruction to produce JSON output
    instruction = "Please determine if the user's response adequately answers the question, considering the conversation so far. If not, provide a polite clarification or request for more information, avoiding repeating previous responses. Respond in JSON format: {\"valid\": true/false, \"clarification\": \"Your message here\"}"
    messages.append({'role': 'assistant', 'content': instruction})

    # Call GPT-4 API
    response = client.chat.completions.create(model="gpt-4o",
    messages=messages,
    max_tokens=150,
    temperature=0.5,
    response_format={ "type": "json_object" })

    assistant_reply = response.choices[0].message.content.strip()

    try:
        result = json.loads(assistant_reply)
        valid = result.get('valid', False)
        clarification = result.get('clarification', '')
        return {'valid': valid, 'clarification': clarification}
    except json.JSONDecodeError:
        # Default to valid response to avoid blocking the flow
        return {'valid': True, 'clarification': ''}

@socketio.on('upload_file_chunk')
def handle_file_chunk(data):
    session_id = request.sid
    data = data.get('data')
    
    claim_id = data.get('claimId')
        
    claim = Claim.query.filter_by(id=claim_id).with_for_update().first()

    filename = data.get('filename')
    chunk_index = data.get('chunk')
    total_chunks = data.get('totalChunks')
    chunk_data = data.get('data')

    # Decode chunk data
    try:
        header, encoded = chunk_data.split(',', 1)
        file_bytes = base64.b64decode(encoded)
    except Exception as e:
        emit('message', {'text': f'Failed to process chunk {chunk_index + 1} of {total_chunks}: {str(e)}'}, room=session_id)
        return

    # Save the chunk to a temporary file
    temp_dir = os.path.join(app.config['UPLOAD_FOLDER'], f"{filename}_chunks")
    os.makedirs(temp_dir, exist_ok=True)
    chunk_path = os.path.join(temp_dir, f"chunk_{chunk_index}")
    with open(chunk_path, 'wb') as chunk_file:
        chunk_file.write(file_bytes)

    # If all chunks are received, reassemble the file
    if chunk_index + 1 == total_chunks:
        final_file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        with open(final_file_path, 'wb') as final_file:
            for i in range(total_chunks):
                with open(os.path.join(temp_dir, f"chunk_{i}"), 'rb') as chunk_file:
                    final_file.write(chunk_file.read())
        # Clean up chunks
        for chunk_file in os.listdir(temp_dir):
            os.remove(os.path.join(temp_dir, chunk_file))
        os.rmdir(temp_dir)

        # Save the file record to the database
        file_record = File(
            claim_id=claim.id,
            filename=filename,
            filepath=final_file_path,
            filetype=mimetypes.guess_type(filename)[0]
        )
        
        file_upload_message = f'File "{filename}" uploaded successfully.'
        file_message = Message(claim_id=claim.id, sender='user', content=file_upload_message)
        db.session.add(file_message)
        
        db.session.add(file_record)
        db.session.commit()

        # Notify client of successful upload
        emit('message', {'text': f'File "{filename}" uploaded successfully.'}, room=session_id)
        emit('message', {'text': 'Please upload any additional files or type "Done" when you are finished.'}, room=session_id)
        
def create_claim():
    session_id = request.sid
    user_uuid = session.get('user_uuid')
    user = User.query.filter_by(user_uuid=user_uuid).with_for_update().first()
    claim_id = session.get('current_claim_id')
    claim = Claim.query.filter_by(id=claim_id).with_for_update().first()
    if not claim:
        return

    answers = json.loads(claim.answers)
    transaction_details = session.get('transaction_details', {})

    # Get files associated with the claim
    files = []
    file_records = File.query.filter_by(claim_id=claim.id).all()
    for file_record in file_records:
        with open(file_record.filepath, 'rb') as f:
            file_data = f.read()
            files.append({
                'name': file_record.filename,
                'data': file_data,
                'type': file_record.filetype,
                'filepath': file_record.filepath  # Include filepath for PDF processing
            })
    # Generate structured summary using LLM
    structured_data = generate_structured_summary(answers, files, transaction_details, claim.additional_info)
    claim.structured_data = json.dumps(structured_data)
    claim.status = 'Pending'
    claim.state = ClaimState.COMPLETED.value

    claim.current_question = None  # Reset current question
    claim.question_index = None
    db.session.commit()

    # Clear session variables
    session.pop('current_claim_id', None)
    session.pop('transaction_details', None)

    # Inform the user that the claim has been submitted
    emit('message', {'text': f'Your claim has been submitted successfully. Your claim ID is {claim.id}. We will notify you when there is an update.'})

    # Save assistant message to chat history
    message = Message(claim_id=claim.id, sender='assistant', content=f'Your claim has been submitted successfully. Your claim ID is {claim.id}. We will notify you when there is an update.')
    db.session.add(message)
    db.session.commit()

    # Run expert reviews in a separate thread to avoid blocking
    run_expert_reviews(claim.id, user_uuid)

def run_expert_reviews(claim_id, user_uuid):
    with app.app_context():
        claim = Claim.query.filter_by(id=claim_id).with_for_update().first()
    if not claim:
        return

    structured_data = json.loads(claim.structured_data)

    # Chargeback policies expert review
    chargeback_feedback = chargeback_policies_expert_review(structured_data)
    print(chargeback_feedback)
    
    expert_feedback = [chargeback_feedback]
    claim.expert_feedback = json.dumps(expert_feedback)
    db.session.commit()

    # Check if any follow-ups are needed
    follow_up_needed = False
    follow_up_messages = []

    if chargeback_feedback.get('action') == 'request_additional_info':
        follow_up_needed = True
        follow_up_messages.append(chargeback_feedback['additional_info_needed'])

    session_id = None
    for sess_id, socket_session in socketio.server.environ.items():
        socket_user_uuid = socket_session.get('user_uuid', session.get('user_uuid'))
        if socket_user_uuid == user_uuid:
            session_id = sess_id
            break

    if follow_up_needed and session_id:
        # Send follow-up messages to the user
        for msg in follow_up_messages:
            emit('message', {'text': "ADDITIONAL INFORMATION REQUIRED: Additional information is required to process your claim: " + msg}, room=session_id)
            # Save assistant message to chat history
            message = Message(claim_id=claim.id, sender='assistant', content= "ADDITIONAL INFORMATION REQUIRED: Additional information is required to process your claim: " + msg)
            db.session.add(message)
            db.session.commit()
        # Set the claim status back to 'In Progress'
        claim = Claim.query.filter_by(id=claim_id).with_for_update().first()
        claim.status = 'Follow-Up Needed'
        claim.state = ClaimState.ADDITIONAL_INFO.value
        db.session.commit()
    if chargeback_feedback.get('action') == 'wait_for_shipping' and session_id:
        # Inform the user to wait
        wait_message = 'Please wait for 10 days past the expected delivery date. If the item has not arrived by then, please let us know.'
        emit('message', {'text': wait_message}, room=session_id)
        # Save assistant message
        message = Message(claim_id=claim.id, sender='assistant', content=wait_message)
        db.session.add(message)
        db.session.commit()
        claim.status = 'Waiting'
        claim.state = ClaimState.COLLECTING_INFO.value
        db.session.commit()
    else:
        # Proceed to send claim to merchant
        send_claim_to_merchant(claim_id)

def send_claim_to_merchant(claim_id):
    with app.app_context():
        claim = Claim.query.filter_by(id=claim_id).with_for_update().first()
    if not claim:
        return

    structured_data = json.loads(claim.structured_data)
    print(structured_data)
    merchant_email = structured_data['transaction_details']['merchant_email']
    merchant_link = f'http://localhost:5000/merchant_view/{claim_id}'

    # Send email to merchant (simplified)
    subject = 'New Chargeback Claim Notification'
    body = f'You have received a new chargeback claim. Please review it here: {merchant_link}'
    send_email(merchant_email, subject, body)

    # Update claim status
    claim.status = 'Awaiting Merchant Response'
    db.session.commit()

def send_email(to_email, subject, body):
    pass

@app.route('/merchant_view/<int:claim_id>')
def merchant_view(claim_id):
    with app.app_context():
        claim = Claim.query.filter_by(id=claim_id).with_for_update().first()
    if not claim:
        return 'Claim not found.', 404
    structured_data = json.loads(claim.structured_data)
    return render_template('merchant_view.html', claim_id=claim_id, structured_data=structured_data)

@socketio.on('merchant_connect')
def merchant_connect(data):
    claim_id = data.get('claim_id')
    if not claim_id:
        emit('error', {'message': 'No claim ID provided.'})
        return
    claim_id = int(claim_id)
    with app.app_context():
        claim = Claim.query.filter_by(id=claim_id).with_for_update().first()
    if not claim:
        emit('error', {'message': 'Invalid claim ID.'})
        return
    join_room(f'merchant_{claim_id}')
    emit('message', {'text': 'Connected to the merchant interface.'})

@socketio.on('merchant_response')
def merchant_response(data):
    claim_id = data.get('claim_id')
    response_text = data.get('text')
    if not claim_id or not response_text:
        emit('error', {'message': 'Invalid data provided.'})
        return
    claim_id = int(claim_id)
    with app.app_context():
        claim = Claim.query.filter_by(id=claim_id).with_for_update().first()
    if not claim:
        emit('error', {'message': 'Invalid claim ID.'})
        return

    # Save merchant response
    claim.merchant_response = response_text
    claim.status = 'Merchant Responded'
    db.session.commit()

    # Proceed to final adjudication
    threading.Thread(target=perform_final_adjudication, args=(claim_id,)).start()
    emit('message', {'text': 'Thank you for your response. We will review the information provided.'})

def perform_final_adjudication(claim_id):
    with app.app_context():
        claim = Claim.query.filter_by(id=claim_id).with_for_update().first()
    if not claim:
        return

    structured_data = json.loads(claim.structured_data)
    merchant_response = claim.merchant_response
    expert_feedback = json.loads(claim.expert_feedback)

    adjudication_result = final_adjudication(structured_data, merchant_response, expert_feedback)
    claim.adjudication_result = json.dumps(adjudication_result)
    claim.status = 'Adjudicated'
    db.session.commit()

    # Notify user of the result
    user_uuid = claim.user.user_uuid

    session_id = None
    for sess_id, socket_session in socketio.server.environ.items():
        socket_user_uuid = socket_session.get('user_uuid', session.get('user_uuid'))
        if socket_user_uuid == user_uuid:
            session_id = sess_id
            break

    if session_id:
        decision = adjudication_result.get('decision', 'Pending')
        rationale = adjudication_result.get('rationale', '')
        message = f"Your claim has been adjudicated. Decision: {decision}. Rationale: {rationale}"
        emit('message', {'text': message}, room=session_id)

        # Save assistant message
        message_record = Message(claim_id=claim.id, sender='assistant', content=message)
        db.session.add(message_record)
        db.session.commit()

@socketio.on('disconnect')
def handle_disconnect():
    print("DISCONNECTING")
    pass

@app.route('/uploaded_files/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    socketio.run(app, debug=False, port=5001, host='0.0.0.0')
