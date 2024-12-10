import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import Flask, render_template, request, redirect, url_for, session, make_response
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS  # Uvozimo CORS
from database import init_app  # Import iz database/db_config.py
from flask_mysqldb import MySQL

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Siguran ključ za sesiju

# Omogućavanje CORS-a za sve rute
CORS(app, supports_credentials=True)

# Inicijalizacija MySQL baze
mysql = init_app(app)

# Početna stranica
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('/frontend/public/index.html')

# Funkcija za učitavanje korisnika iz baze
def get_user_by_email(email):
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT id, email, password FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    cursor.close()  # Zatvori kursor nakon upita
    return user

# Funkcija za dodavanje korisnika u bazu
def add_user(first_name, last_name, address, city, country, phone, email, password):
    cursor = mysql.connection.cursor()
    hashed_password = generate_password_hash(password)
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
            return {'message': 'Prijavljeni ste uspešno!'}, 200
        else:
            return {'error': 'Pogrešan email ili lozinka'}, 400
    return {'error': 'Method not allowed'}, 405




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
            return {'error': 'Email već postoji'}, 400
        
        # Kreiraj novog korisnika i dodaj ga u bazu
        add_user(first_name, last_name, address, city, country, phone_number, email, password)
        
        return {'message': 'Korisnik je uspešno registrovan!'}, 201
    
    return {'error': 'Method not allowed'}, 405


# Odjava korisnika
@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('user_name', None)
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
