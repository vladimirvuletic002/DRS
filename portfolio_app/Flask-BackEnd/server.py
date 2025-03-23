import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import time

from flask import Flask, render_template, request, redirect, url_for, session, make_response, jsonify
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS  # Uvozimo CORS
from sqlalchemy import func, case

from models.user import User
from models.transaction import Transaction
from models.stock import Stock
from models.portfolio import Portfolio
from config import Config
from models import db
from datetime import datetime, timezone

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Siguran ključ za sesiju
app.config.from_object(Config)
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

db.init_app(app)

# Omogućavanje CORS-a za sve rute
CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["http://localhost:3000"]}})



# Pocetna stranica
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('/fronted/public/index.html')


# Prijava korisnika
@app.route('/login', methods=['POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        email = data.get('email')
        user = User.query.filter_by(email=data['email']).first()
        password = data.get('password')


        # Proveri da li postoji korisnik i da li lozinka odgovara
        if user and check_password_hash(user.password_hash, password):  # user[2] je password iz tuple-a
            session['user_id'] = user.id  # user[0] je id iz tuple-a
            session['user_name'] = user.email  # user[1] je email iz tuple-a
            return jsonify({'message': 'Prijavljeni ste uspešno!'}), 200
        else:
            return jsonify({'error': 'Invalid email or password!'}), 400
    return jsonify({'error': 'Method not allowed'}), 405




# Registracija korisnika
@app.route('/register', methods=['POST'])
def register():
    if request.method == 'POST':
        
        data = request.get_json()
        
        password = data.get('password')
        confirm = data.get('potvrda')
        

        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Proveri da li su nova lozinka i potvrda iste
        if password != confirm:
            return jsonify({'error': "Passwords don't match!"}), 400

        new_user = User(
            first_name=data['first_name'],
            last_name=data['last_name'],
            address=data['address'],
            city=data['city'],
            country=data['country'],
            phone=data['phone'],
            email=data['email'],
            password_hash=generate_password_hash(data['password'])
        )

        
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User registered successfully'}), 201
    
    return {'error': 'Method not allowed'}, 405


# Odjava korisnika
@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    session.pop('user_name', None)
    return jsonify({'message': 'Logged out successfully'}), 200

# Ruta za dobavljanje podataka o trenutno ulogovanom korisniku
@app.route('/user', methods=['GET'])
def get_user():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'first_name': user.first_name,
        'last_name': user.last_name,
        'address': user.address,
        'city': user.city,
        'country': user.country,
        'phone': user.phone,
        'email': user.email
    }), 200


# Ruta za izmenu korisnickih podataka
@app.route('/edit-profile', methods=['POST'])
def update_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    user_id = session['user_id']

    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.first_name = data.get('first_name', user.first_name)
    user.last_name = data.get('last_name', user.last_name)
    user.address = data.get('address', user.address)
    user.city = data.get('city', user.city)
    user.country = data.get('country', user.country)
    user.phone = data.get('phone', user.phone)

    db.session.commit()

    return jsonify({'message': 'Profile updated successfully!'}), 200


# Ruta za promenu lozinke
@app.route('/change_password', methods=['POST'])
def change_password():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    user_id = session['user_id']

    current_password = data.get('current_password')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')

    # Proveri da li su nova lozinka i potvrda iste
    if new_password != confirm_password:
        return jsonify({'error': 'New password and confirmation do not match'}), 400

    user = User.query.get(user_id)

    if not user or not check_password_hash(user.password_hash, current_password):
        return jsonify({'error': 'Incorrect current password'}), 400

    # Hesiraj novu lozinku i sacuvaj u bazi
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({'passMessage': 'Password changed successfully'}), 200

#@app.route('/get-portfolio-value', methods=['GET'])
def get_balance(user_id):

    # Izračunavanje vrednosti portfolija
    balance = db.session.query(
        func.sum(
            case(
                (Transaction.transaction_type == 'buy', -(Transaction.price*Transaction.quantity)),
                (Transaction.transaction_type == 'sell', Transaction.price*Transaction.quantity),
                else_=0
            )
        )
    ).filter(Transaction.user_id == user_id).scalar()

    # Ako nema transakcija, postavi vrednost na 0
    balance = balance if balance is not None else 0

    #return jsonify({'portfolio_value': portfolio_value})
    return balance

#dodavanje transakcije
@app.route('/transactions', methods=['POST'])
def create_transaction():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    user_id = session['user_id']
    stock_name = data.get("stock_name")
    transaction_type = data.get("transaction_type")
    quantity = int(data.get("quantity"))
    price = float(data.get("price"))

    if not all([user_id, stock_name, transaction_type, quantity, price]):
        return jsonify({"error": "Missing data"}), 400

    transaction = Transaction(
        user_id=user_id,
        stock_name=stock_name,
        transaction_type=transaction_type,
        quantity=quantity,
        price=price,
        date=datetime.now(timezone.utc).replace(tzinfo=None)
    )

    symbol_splt, name_splt = stock_name.split(" - ", 1)

    stock = Stock.query.filter_by(name=name_splt, user_id=user_id).first()
    user_portfolio = Portfolio.query.filter_by(user_id=user_id).first() 

    if transaction_type == "buy":
        if stock and user_portfolio:
            if user_portfolio.buy_power < price * quantity:
                return jsonify({"error": "Not enough funds!"}), 400
            transaction_val = price * quantity
            stock.quantity += quantity
            stock.total_price += transaction_val
            if user_portfolio.balance == 0.0:
                user_portfolio.balance = get_balance(user_id)
            user_portfolio.balance -= transaction_val
            user_portfolio.buy_power -= transaction_val
        elif user_portfolio is None:
            return jsonify({"error": "Not enough funds!"}), 400
        else:
            if user_portfolio.buy_power < price * quantity:
                return jsonify({"error": "Not enough funds!"}), 400
            stock = Stock(user_id=user_id, symbol=symbol_splt.strip(), name=name_splt, total_price=price * quantity, quantity=quantity)
            if user_portfolio.balance == 0.0:
                user_portfolio.balance = get_balance(user_id)
            user_portfolio.balance -= price*quantity
            user_portfolio.buy_power -= price*quantity
            db.session.add(stock)
    elif transaction_type == "sell":
        if stock and stock.quantity >= quantity and user_portfolio:
            stock.quantity -= quantity
            stock.total_price -= price * quantity
            user_portfolio.balance += price * quantity
            user_portfolio.buy_power += price * quantity
            if stock.quantity == 0:
                db.session.delete(stock)  # Brise akciju ako je kolicina 0
                db.session.query(Transaction).filter(Transaction.user_id == user_id,
        Transaction.stock_name == stock_name).delete()
        else:
            return jsonify({"error": "Not enough stocks to sell"}), 400

    db.session.add(transaction)
    db.session.commit()

    return jsonify({"message": "Transaction recorded successfully"}), 201

#rute za dashboard
@app.route('/get-stocks', methods=['GET'])
def get_stocks():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']

    # Dohvati sve akcije koje korisnik poseduje
    stocks = Stock.query.filter_by(user_id=user_id).all()

    # Izvuci simbole koje korisnik poseduje
    owned_symbols = [stock.symbol for stock in stocks]

    # Prosecne cene 'buy' transakcija po simbolu
    average_prices = db.session.query(
        func.substring_index(Transaction.stock_name, ' - ', 1).label('symbol'),
        func.avg(Transaction.price).label('average_price')
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == 'buy',
        func.substring_index(Transaction.stock_name, ' - ', 1).in_(owned_symbols)
    ).group_by('symbol').all()

    # Konvertuj prosečne cene u dict za lakši pristup
    average_price_map = {symbol: round(avg_price, 2) for symbol, avg_price in average_prices}

    # Kreiraj konačnu listu sa dodatom prosečnom cenom
    stocks_data = [
        {
            "symbol": stock.symbol,
            "name": stock.name,
            "quantity": stock.quantity,
            "average_price": average_price_map.get(stock.symbol, 0)  # Ako nema kupovina, stavi 0
        }
        for stock in stocks
    ]

    return jsonify(stocks_data)

#dodavanje sredstava
@app.route('/add-funds', methods=['POST'])
def add_funds():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json
    user_id = session['user_id']
    buy_power = float(data.get("buy_power"))

    user_portfolio = Portfolio.query.filter_by(user_id=user_id).first()

    if user_portfolio:
        user_portfolio.buy_power += buy_power
    else:
        user_portfolio = Portfolio(user_id=user_id, buy_power=buy_power)
        db.session.add(user_portfolio)

    fundsData = { 'buy_power': user_portfolio.buy_power }

    db.session.commit()

    return jsonify(fundsData)

# Ruta za dobavljanje podataka o novcanim sredstvima 
@app.route('/funds', methods=['GET'])
def get_funds():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    
    user_portfolio = Portfolio.query.filter_by(user_id=user_id).first()
    
    if not user_portfolio:
        return jsonify({'funds': 0.0, 'balance': 0.0})

    return jsonify({
        "funds": user_portfolio.buy_power,
        "balance": user_portfolio.balance        
    }), 200


# Kreiranje baze ako ne postoji
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
