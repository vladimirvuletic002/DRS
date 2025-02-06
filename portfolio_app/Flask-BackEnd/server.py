import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import Flask, render_template, request, redirect, url_for, session, make_response, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS  # Uvozimo CORS
#from database.db_config import init_app  # Import iz database/db_config.py
#from flask_mysqldb import MySQL

from models.user import User
from config import Config
from models import db

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Siguran ključ za sesiju
app.config.from_object(Config)

db.init_app(app)

# Omogućavanje CORS-a za sve rute
CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["http://localhost:3000"]}})

# Inicijalizacija MySQL baze
#mysql = init_app(app)

# Pocetna stranica
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('/fronted/public/index.html')

# Funkcija za učitavanje korisnika iz baze
#def get_user_by_email(email):
    #with mysql.connection.cursor() as cursor:
        #cursor.execute("SELECT id, email, password FROM users WHERE email = %s", (email,))
        #return cursor.fetchone()

# Funkcija za dodavanje korisnika u bazu
#def add_user(first_name, last_name, address, city, country, phone, email, password):
    #hashed_password = generate_password_hash(password)
    #with mysql.connection.cursor() as cursor:
        #cursor.execute("""
            #INSERT INTO users (first_name, last_name, address, city, country, phone_number, email, #password)
            #VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        #""", (first_name, last_name, address, city, country, phone, email, hashed_password))
        #mysql.connection.commit()

# Prijava korisnika
@app.route('/login', methods=['POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        email = data.get('email')
        user = User.query.filter_by(email=data['email']).first()
        password = data.get('password')

        # Proveri korisnika prema email-u
        #user = get_user_by_email(email)

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
        # Dobijanje podataka u JSON formatu sa frontenda
        data = request.get_json()
        
        # Ekstrahovanje podataka iz JSON-a
        
        password = data.get('password')
        confirm = data.get('potvrda')
        
        # Proveri da li korisnik sa tim email-om već postoji
        #if get_user_by_email(email):
            #return jsonify({'error': 'Email already exists!'}), 400
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
        
        # Kreiraj novog korisnika i dodaj ga u bazu
        #add_user(first_name, last_name, address, city, country, phone_number, email, password)
        
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
    
    # Koristi SQLAlchemy da nađe korisnika po ID-ju
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


# Ruta za ažuriranje korisničkih podataka
@app.route('/edit-profile', methods=['POST'])
def update_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    user_id = session['user_id']

    # Pronađi korisnika u bazi
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Ažuriraj korisničke podatke
    user.first_name = data.get('first_name', user.first_name)
    user.last_name = data.get('last_name', user.last_name)
    user.address = data.get('address', user.address)
    user.city = data.get('city', user.city)
    user.country = data.get('country', user.country)
    user.phone = data.get('phone', user.phone)

    # Sačuvaj izmene
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

    # Pronađi korisnika u bazi
    user = User.query.get(user_id)

    if not user or not check_password_hash(user.password_hash, current_password):
        return jsonify({'error': 'Incorrect current password'}), 400

    # Hesiraj novu lozinku i sačuvaj u bazi
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({'passMessage': 'Password changed successfully'}), 200

# Kreiranje baze ako ne postoji
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
