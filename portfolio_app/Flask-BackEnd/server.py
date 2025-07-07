import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import jwt
import requests
from flask import Flask, render_template, request, redirect, url_for, session, make_response, jsonify
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS  # Uvozimo CORS
from sqlalchemy import func, case
from threading import Thread
from models.user import User
from models.transaction import Transaction
from models.stock import Stock
from models.portfolio import Portfolio
from config import Config
from models import db
from functools import wraps
from datetime import datetime, timezone, timedelta
from waitress import serve
from flask_bcrypt import Bcrypt



app = Flask(__name__)
#app.secret_key = 'your_secret_key'  # Siguran ključ za sesiju
'''app.config["SESSION_TYPE"] = "filesystem"
Session(app)'''
app.config.from_object(Config)

db.init_app(app)
bcrypt = Bcrypt(app)
#jwt = JWTManager(app)

# Omogućavanje CORS-a za sve rute
#CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["http://localhost:3000"]}})
#CORS(app, supports_credentials=True, expose_headers=["Authorization"])
CORS(app, supports_credentials=True, origins=["http://localhost:3000"], expose_headers=["Authorization"])
#CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})


def token_required(func):
    @wraps(func)
    def decorated(*args, **kwargs):
        token = request.args.get('token')
        if not token:
            return jsonify({'Alert': 'Token is missing'})
        try:
            payload = jwt.decode(token, app.config['JWT_SECRET_KEY'])
        except:
            return jsonify({'Alert': 'Invalid token'})
        return func(*args, **kwargs)
    return decorated

def authentication():
    auth_header = request.headers.get('Authorization')

    if not auth_header or not auth_header.startswith("Bearer "):
        #return jsonify({'error': 'Token is missing'}), 401
        return None
        
    token = auth_header.split("Bearer ")[1]

    try:
        payload = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        #return jsonify({'error': 'Token has expired'}), 401
        return None
    except jwt.InvalidTokenError:
        #return jsonify({'error': 'Invalid token'}), 401
        return None

    user_id = payload['user_id']
    return user_id


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
            #session['user_id'] = user.id  # user[0] je id iz tuple-a
            #session['user_name'] = user.email  # user[1] je email iz tuple-a
            token = jwt.encode({
                'user_id': user.id,
                'expiration': str(datetime.utcnow() + timedelta(minutes=60))
            },
                app.config['JWT_SECRET_KEY'])
            return jsonify({'token': token}), 200
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


# Ruta za dobavljanje podataka o trenutno ulogovanom korisniku
@app.route('/user', methods=['GET'])
def get_user():
    user_id = authentication()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

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
#@token_required
def update_profile():
    user_id = authentication()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    user = User.query.get(user_id)    

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()

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
#@token_required
def change_password():
    user_id = authentication()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)    
        
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()



    current_password = data.get('current_password')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')

    # Proveri da li su nova lozinka i potvrda iste
    if new_password != confirm_password:
        return jsonify({'error': 'New password and confirmation do not match'}), 400

    #user = User.query.get(user_id)

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

#def process_transaction(data, user_id, stock_name, transaction_type, quantity, price):
    #with app.app_context():
        

        
#dodavanje transakcije
@app.route('/transactions', methods=['POST'])
def create_transaction():
    user_id = authentication()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)    
        
    if not user:
        return jsonify({'error': 'User not found'}), 404 
    
    data = request.json
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

    # Pokretanje niti (thread) za obradu transakcije
    #t = Thread(target=process_transaction, args=(user_id, stock_name, transaction_type, quantity, price))
    #t.start()
    # t.join()


    db.session.add(transaction)
    db.session.commit()



    return jsonify({"message": "Transaction recorded successfully"}), 201

#ruta za brisanje akcije iz tabele
@app.route('/delete-stock', methods=['POST'])
def delete_stock():
    user_id = authentication()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    user = User.query.get(user_id)    

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    symbol = data.get('symbol')

    if not symbol:
        return jsonify({'error': 'Missing stock symbol'}), 400

    stock = Stock.query.filter_by(user_id=user_id, symbol=symbol).first()

    if not stock:
        return jsonify({'error': 'Stock not found'}), 404
    
    portfolio = Portfolio.query.filter_by(user_id=user_id).first()

    if not portfolio:
        return jsonify({'error': 'Portfolio not found'}), 404

    # Vracanje sredstava
    refund = stock.total_price
    portfolio.balance += refund
    portfolio.buy_power += refund

    db.session.delete(stock)
    db.session.query(Transaction).filter(Transaction.user_id == user_id, Transaction.stock_name.like(f"{symbol} - %")).delete()

    db.session.commit()

    return jsonify({'message': f'Stock {symbol} deleted successfully and funds returned'}), 200    

#rute za dashboard
@app.route('/get-stocks', methods=['GET'])
def get_stocks():
    user_id = authentication()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)    
        
    if not user:
        return jsonify({'error': 'User not found'}), 404
    

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
    user_id = authentication()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)    
        
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.json
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
    user_id = authentication()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)    
        
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user_portfolio = Portfolio.query.filter_by(user_id=user_id).first()
    
    if not user_portfolio:
        return jsonify({'funds': 0.0, 'balance': 0.0})

    return jsonify({
        "funds": user_portfolio.buy_power,
        "balance": user_portfolio.balance        
    }), 200

'''def process_transaction(user_id, stock_name, transaction_type, quantity, price):
    with app.app_context():  # vazno za rad sa bazom iz procesa
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
                    return  # nema dovoljno sredstava
                transaction_val = price * quantity
                stock.quantity += quantity
                stock.total_price += transaction_val
                if user_portfolio.balance == 0.0:
                    user_portfolio.balance = get_balance(user_id)
                user_portfolio.balance -= transaction_val
                user_portfolio.buy_power -= transaction_val
            elif user_portfolio:
                if user_portfolio.buy_power < price * quantity:
                    return
                stock = Stock(user_id=user_id, symbol=symbol_splt.strip(), name=name_splt,
                              total_price=price * quantity, quantity=quantity)
                if user_portfolio.balance == 0.0:
                    user_portfolio.balance = get_balance(user_id)
                user_portfolio.balance -= price * quantity
                user_portfolio.buy_power -= price * quantity
                db.session.add(stock)
            else:
                return
        elif transaction_type == "sell":
            if stock and stock.quantity >= quantity and user_portfolio:
                stock.quantity -= quantity
                stock.total_price -= price * quantity
                user_portfolio.balance += price * quantity
                user_portfolio.buy_power += price * quantity
                if stock.quantity == 0:
                    db.session.delete(stock)
                    db.session.query(Transaction).filter(
                        Transaction.user_id == user_id,
                        Transaction.stock_name == stock_name
                    ).delete()
            else:
                return

        db.session.add(transaction)
        db.session.commit()'''


# Kreiranje baze ako ne postoji
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    serve(app, host='0.0.0.0', port=8080)
