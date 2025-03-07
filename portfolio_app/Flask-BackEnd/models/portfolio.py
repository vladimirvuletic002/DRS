from models import db

class Portfolio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    balance = db.Column(db.Float, nullable=False, default=0.0, server_default='0.0')
    buy_power = db.Column(db.Float, nullable=False, default=0.0, server_default='0.0')