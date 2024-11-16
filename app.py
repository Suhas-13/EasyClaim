import os
os.environ['EVENTLET_HUB'] = 'poll'

import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, request, session, redirect, url_for, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room, leave_room
from utils.llm_utils import (
    generate_structured_summary,
    shipping_expert_review,
    chargeback_policies_expert_review,
    final_adjudication
)
import smtplib
from email.mime.text import MIMEText
import threading
import base64
import json
from datetime import datetime
import mimetypes

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///claims.db'
app.config['UPLOAD_FOLDER'] = 'uploaded_files'
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])
db = SQLAlchemy(app)
socketio = SocketIO(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), unique=True)
    claims = db.relationship('Claim', backref='user', lazy=True)

class Claim(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    raw_text = db.Column(db.Text)
    structured_data = db.Column(db.Text)
    status = db.Column(db.String(50))
    adjudication_result = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    messages = db.relationship('Message', backref='claim', lazy=True)
    files = db.relationship('File', backref='claim', lazy=True)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    claim_id = db.Column(db.Integer, db.ForeignKey('claim.id'))
    sender = db.Column(db.String(50))  # 'user' or 'assistant'
    content = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class File(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    claim_id = db.Column(db.Integer, db.ForeignKey('claim.id'))
    filename = db.Column(db.String(200))
    filepath = db.Column(db.String(500))
    filetype = db.Column(db.String(50))
    description = db.Column(db.Text)


questions = [
    {
        'id': 'issue_type',
        'question': 'Please select the issue you are experiencing:',
        'options': ['Item not received', 'Item damaged', 'Unauthorized transaction', 'Other'],
        'next': {
            'Item not received': 'tracking_info',
            'Item damaged': 'damage_description',
            'Unauthorized transaction': 'unauthorized_details',
            'Other': 'additional_details_other'
        }
    },
    {
        'id': 'tracking_info',
        'question': 'Do you have a tracking number or shipping link for your order?',
        'options': ['Yes', 'No'],
        'next': {
            'Yes': 'collect_tracking_info',
            'No': 'evidence_available'
        }
    },
    {
        'id': 'collect_tracking_info',
        'question': 'Please provide the tracking number or shipping link.',
        'next': 'evidence_available'
    },
    {
        'id': 'damage_description',
        'question': 'Please describe the damage to the item.',
        'next': 'evidence_available'
    },
    {
        'id': 'unauthorized_details',
        'question': 'Have you reported this unauthorized transaction to your bank?',
        'options': ['Yes', 'No'],
        'next': 'evidence_available'
    },
    {
        'id': 'additional_details_other',
        'question': 'Please provide additional details about the issue.',
        'next': 'evidence_available'
    },
    {
        'id': 'evidence_available',
        'question': 'Do you have any evidence to support your claim? (e.g., photos, receipts)',
        'options': ['Yes', 'No'],
        'next': {
            'Yes': 'collect_evidence',
            'No': 'finalize'
        }
    },
    {
        'id': 'collect_evidence',
        'question': 'Please upload your evidence files.',
        'next': 'finalize'
    },
    {
        'id': 'finalize',
        'question': 'Thank you. We have collected all the necessary information.',
        'next': None
    }
]

def get_question_by_id(question_id):
    for question in questions:
        if question['id'] == question_id:
            return question
    return None

@app.route('/')
def index():
    # For testing purposes, we're using hardcoded transaction details
    # In a real application, these would be provided based on user selection
    transaction_details = {
        'transaction_name': 'Purchase at ABC Store',
        'date': '2023-10-15',
        'merchant_name': 'ABC Store',
        'merchant_email': 'merchant@example.com',
        'transaction_id': 'TX1234567890'
    }
    return render_template('index.html', transaction_details=transaction_details)

@socketio.on('connect')
def handle_connect():
    session_id = request.sid
    # Get transaction details from the client
    transaction_details_json = request.args.get('transaction_details')
    if transaction_details_json:
        transaction_details = json.loads(transaction_details_json)
    else:
        # For testing, use default transaction details
        transaction_details = {
            'transaction_name': 'Purchase at ABC Store',
            'date': '2023-10-15',
            'merchant_name': 'ABC Store',
            'merchant_email': 'merchant@example.com',
            'transaction_id': 'TX1234567890'
        }

    # Create or get the user
    user = User.query.filter_by(session_id=session_id).first()
    if not user:
        user = User(session_id=session_id)
        db.session.add(user)
        db.session.commit()

    session['current_question'] = 'issue_type'
    session['answers'] = {}
    session['transaction_details'] = transaction_details

    # Send initial message with transaction details
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
    ask_next_question()

def ask_next_question():
    question_id = session.get('current_question')
    question = get_question_by_id(question_id)

    if question:
        emit('message', {'text': question['question'], 'options': question.get('options', [])})
    else:
        # Process the collected information and create a structured claim
        create_claim()

@socketio.on('user_response')
def handle_user_response(data):
    session_id = request.sid
    question_id = session.get('current_question')
    question = get_question_by_id(question_id)
    user_response = data.get('text')

    # Save the user's response
    answers = session.get('answers', {})
    answers[question_id] = user_response
    session['answers'] = answers

    # Save message to database
    user = User.query.filter_by(session_id=session_id).first()
    claim = Claim.query.filter_by(user_id=user.id).order_by(Claim.id.desc()).first()
    if claim:
        message = Message(claim_id=claim.id, sender='user', content=user_response)
        db.session.add(message)
        db.session.commit()

    # Determine the next question
    next_question_id = None
    if 'next' in question:
        if isinstance(question['next'], dict):
            next_question_id = question['next'].get(user_response, None)
        else:
            next_question_id = question['next']

    if next_question_id:
        session['current_question'] = next_question_id
        ask_next_question()
    else:
        # No more questions; finalize the claim
        create_claim()

@socketio.on('upload_file')
def handle_file_upload(data):
    session_id = request.sid
    file_data = data.get('file')
    file_name = data.get('filename')
    # Decode the data URL
    header, encoded = file_data.split(',', 1)
    file_bytes = base64.b64decode(encoded)
    # Save the file to the server
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_name)
    with open(file_path, 'wb') as f:
        f.write(file_bytes)

    # Save file info to database
    user = User.query.filter_by(session_id=session_id).first()
    claim = Claim.query.filter_by(user_id=user.id).order_by(Claim.id.desc()).first()
    if claim:
        file_record = File(claim_id=claim.id, filename=file_name, filepath=file_path, filetype=mimetypes.guess_type(file_name)[0])
        db.session.add(file_record)
        db.session.commit()

        # Add file message to chat history
        message = Message(claim_id=claim.id, sender='user', content=f'Uploaded file: {file_name}')
        db.session.add(message)
        db.session.commit()

    emit('message', {'text': 'File received.'})
    # Proceed to the next question
    question = get_question_by_id(session.get('current_question'))
    next_question_id = question.get('next')
    if next_question_id:
        session['current_question'] = next_question_id
        ask_next_question()
    else:
        create_claim()

def create_claim():
    session_id = request.sid
    user = User.query.filter_by(session_id=session_id).first()
    if not user:
        return

    answers = session.get('answers', {})
    transaction_details = session.get('transaction_details', {})

    # Combine the answers into raw text
    raw_text = '\n'.join([f"{key}: {value}" for key, value in answers.items()])

    # Include transaction details in the raw text
    transaction_info = '\n'.join([f"{key}: {value}" for key, value in transaction_details.items()])
    raw_text = f"Transaction Details:\n{transaction_info}\n\nUser Responses:\n{raw_text}"

    # Get files associated with the claim
    files = []
    claim = Claim(user_id=user.id, raw_text=raw_text, status='Pending')
    db.session.add(claim)
    db.session.commit()

    file_records = File.query.filter_by(claim_id=claim.id).all()
    for file_record in file_records:
        with open(file_record.filepath, 'rb') as f:
            file_data = f.read()
            files.append({
                'name': file_record.filename,
                'data': file_data,
                'type': file_record.filetype
            })

    # Generate structured summary using LLM
    structured_data = generate_structured_summary(raw_text, files, user.id, transaction_details)
    claim.structured_data = json.dumps(structured_data)
    db.session.commit()

    # Inform the user that the claim has been submitted
    emit('message', {'text': f'Your claim has been submitted successfully. Your claim ID is {claim.id}.'})

    # Run expert reviews in a separate thread to avoid blocking
    threading.Thread(target=run_expert_reviews, args=(claim.id,)).start()

def run_expert_reviews(claim_id):
    claim = Claim.query.get(claim_id)
    if not claim:
        return

    structured_data = json.loads(claim.structured_data)
    session_id = claim.user.session_id

    # Shipping expert review
    shipping_feedback = shipping_expert_review(structured_data)
    # Chargeback policies expert review
    chargeback_feedback = chargeback_policies_expert_review(structured_data)

    expert_feedback = {
        'shipping': shipping_feedback,
        'chargeback': chargeback_feedback
    }
    claim.expert_feedback = json.dumps(expert_feedback)
    db.session.commit()

    # Check if any follow-ups are needed
    follow_up_needed = False
    follow_up_messages = []

    if shipping_feedback.get('additional_info_needed'):
        follow_up_needed = True
        follow_up_messages.append(shipping_feedback['additional_info_needed'])

    if chargeback_feedback.get('additional_info_needed'):
        follow_up_needed = True
        follow_up_messages.append(chargeback_feedback['additional_info_needed'])

    if follow_up_needed:
        # Send follow-up messages to the user
        for msg in follow_up_messages:
            emit('message', {'text': msg}, room=session_id)
            # Save assistant message to chat history
            message = Message(claim_id=claim.id, sender='assistant', content=msg)
            db.session.add(message)
            db.session.commit()
        # TODO: Handle follow-up responses from the user
    elif shipping_feedback.get('action') == 'wait_for_delivery':
        # Inform the user to wait
        wait_message = 'Our experts suggest waiting until the expected delivery date before proceeding with the dispute.'
        emit('message', {'text': wait_message}, room=session_id)
        # Save assistant message
        message = Message(claim_id=claim.id, sender='assistant', content=wait_message)
        db.session.add(message)
        db.session.commit()
        claim.status = 'Waiting for Delivery'
        db.session.commit()
    else:
        # Proceed to send claim to merchant
        send_claim_to_merchant(claim_id)

def send_claim_to_merchant(claim_id):
    claim = Claim.query.get(claim_id)
    if not claim:
        return

    structured_data = json.loads(claim.structured_data)
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
    # Simplified email sending function
    from_email = 'noreply@yourdomain.com'
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = from_email
    msg['To'] = to_email

    # Send the email (replace with your SMTP server details)
    try:
        smtp = smtplib.SMTP('localhost')  # or your SMTP server
        smtp.sendmail(from_email, [to_email], msg.as_string())
        smtp.quit()
        print(f"Email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")

@app.route('/merchant_view/<int:claim_id>')
def merchant_view(claim_id):
    claim = Claim.query.get(claim_id)
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
    claim = Claim.query.get(claim_id)
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
    claim = Claim.query.get(claim_id)
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
    claim = Claim.query.get(claim_id)
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
    session_id = claim.user.session_id
    if session_id:
        decision = adjudication_result.get('decision', 'Pending')
        rationale = adjudication_result.get('rationale', '')
        message = f"Your claim has been adjudicated. Decision: {decision}. Rationale: {rationale}"
        emit('message', {'text': message}, room=session_id)

@socketio.on('disconnect')
def handle_disconnect():
    session_id = request.sid
    # No need to remove sessions as data is stored in the database

@app.route('/uploaded_files/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True)
