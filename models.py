from database import db
from datetime import datetime

class Claim(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer)  # Placeholder for user identification
    raw_text = db.Column(db.Text, nullable=False)
    structured_data = db.Column(db.JSON)
    status = db.Column(db.String(50), default='Pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    claim_id = db.Column(db.Integer, db.ForeignKey('claim.id'), nullable=False)
    sender = db.Column(db.String(50))  # 'cardholder', 'merchant', 'expert', 'adjudicator'
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
