from models import db
from datetime import datetime, timezone

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    stock_name = db.Column(db.String(50), nullable=False)
    transaction_type = db.Column(db.String(10), nullable=False)  # "buy" ili "sell"
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.now(timezone.utc).replace(tzinfo=None))