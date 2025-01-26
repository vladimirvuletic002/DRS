import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import Flask, render_template, request, redirect, url_for, session, make_response, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS  # Uvozimo CORS
from database import init_app  # Import iz database/db_config.py
from flask_mysqldb import MySQL

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Siguran ključ za sesiju

# Omogućavanje CORS-a za sve rute
CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["http://localhost:3000"]}})

# Inicijalizacija MySQL baze
mysql = init_app(app)

# Pocetna stranica
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('/fronted/public/index.html')

# Funkcija za učitavanje korisnika iz baze
def get_user_by_email(email):
    with mysql.connection.cursor() as cursor:
        cursor.execute("SELECT id, email, password FROM users WHERE email = %s", (email,))
        return cursor.fetchone()

# Funkcija za dodavanje korisnika u bazu
def add_user(first_name, last_name, address, city, country, phone, email, password):
    hashed_password = generate_password_hash(password)
    with mysql.connection.cursor() as cursor:
        cursor.execute("""
            INSERT INTO users (first_name, last_name, address, city, country, phone_number, email, password)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (first_name, last_name, address, city, country, phone, email, hashed_password))
        mysql.connection.commit()

# Prijava korisnika
@app.route('/login', methods=['POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        # Proveri korisnika prema email-u
        user = get_user_by_email(email)

        # Proveri da li postoji korisnik i da li lozinka odgovara
        if user and check_password_hash(user[2], password):  # user[2] je password iz tuple-a
            session['user_id'] = user[0]  # user[0] je id iz tuple-a
            session['user_name'] = user[1]  # user[1] je email iz tuple-a
            return jsonify({'message': 'Prijavljeni ste uspešno!'}), 200
        else:
            return jsonify({'error': 'Invalid email or password'}), 400
    return jsonify({'error': 'Method not allowed'}), 405




# Registracija korisnika
@app.route('/register', methods=['POST'])
def register():
    if request.method == 'POST':
        # Dobijanje podataka u JSON formatu sa frontenda
        data = request.get_json()
        
        # Ekstrahovanje podataka iz JSON-a
        first_name = data.get('ime')
        last_name = data.get('prezime')
        address = data.get('adresa')
        city = data.get('grad')
        country = data.get('drzava')
        phone_number = data.get('brojTelefona')
        email = data.get('email')
        password = data.get('lozinka')
        
        # Proveri da li korisnik sa tim email-om već postoji
        if get_user_by_email(email):
            return jsonify({'error': 'Email already exists!'}), 400
        
        # Kreiraj novog korisnika i dodaj ga u bazu
        add_user(first_name, last_name, address, city, country, phone_number, email, password)
        
        return jsonify({'message': 'Korisnik je uspešno registrovan!'}), 201
    
    return {'error': 'Method not allowed'}, 405


# Odjava korisnika
@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('user_name', None)
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
