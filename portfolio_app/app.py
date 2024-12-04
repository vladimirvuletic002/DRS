import json
from flask import Flask, render_template, request, redirect, url_for, session
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Siguran ključ za sesiju

# Test lista korisnika
users_list = []

# Funkcija za učitavanje korisnika iz JSON fajla
def load_users():
    try:
        with open('users.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []  # Ako fajl ne postoji, vrati prazan list

# Funkcija za čuvanje korisnika u JSON fajl
def save_users(users):
    with open('users.json', 'w') as f:
        json.dump(users, f, indent=4)

# Početna stranica
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('login.html')

# Prijava korisnika
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        users = load_users()  # Učitaj sve korisnike iz JSON fajla
        user = next((u for u in users if u['email'] == email), None)
        
        if user and user['password'] == password:  # Proveri običnu lozinku
            session['user_id'] = user['id']  # Korisnički ID
            session['user_name'] = user['first_name']  # Ime korisnika
            return redirect(url_for('dashboard'))
        else:
            return render_template('login.html', error="Pogrešan email ili lozinka")

    return render_template('login.html')

# Dashboard stranica korisnika
@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))  # Ako nema sesije, preusmeri na login
    
    # Učitaj korisnika sa sesijom
    users = load_users()
    user = next((u for u in users if u['id'] == session['user_id']), None)

    if user is None:
        return redirect(url_for('login'))  # Ako korisnik nije pronađen, preusmeri na login
    
    return render_template('dashboard.html', user=user)

# Registracija korisnika
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        first_name = request.form['first_name']
        last_name = request.form['last_name']
        address = request.form['address']
        city = request.form['city']
        country = request.form['country']
        phone_number = request.form['phone_number']
        email = request.form['email']
        password = request.form['password']
        
        # Učitaj korisnike iz JSON fajla
        users = load_users()  # Učitavanje korisnika iz fajla
        
        # Proveri da li korisnik sa tim email-om već postoji
        if any(u['email'] == email for u in users):
            return render_template('register.html', error="Email već postoji")
        
         # Kreiraj novog korisnika i dodaj ga u listu
        new_user = {
            'id': len(users) + 1,
            'first_name': first_name,
            'last_name': last_name,
            'address': address,
            'city': city,
            'country': country,
            'phone_number': phone_number,
            'email': email,
            'password': password,  # Čuvanje lozinke kao običan tekst
            'role': 'user'  # Možeš dodati i ulogu, ako je potrebno
        }
        users.append(new_user)
        
        # Spremi korisnike u JSON fajl
        save_users(users)

        return redirect(url_for('login'))
    
    return render_template('register.html')

# Dodavanje transakcije (trenutno nije povezano sa bazom podataka)
@app.route('/add_transaction', methods=['GET', 'POST'])
def add_transaction():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    if request.method == 'POST':
        action = request.form['action']
        stock_name = request.form['stock_name']
        quantity = request.form['quantity']
        price_per_unit = request.form['price_per_unit']
        transaction_date = request.form['transaction_date']
        
        # Ovaj deo nije povezan sa bazom, ali možeš sačuvati transakciju u listu
        # ili koristiti JSON fajl za trajno čuvanje, zavisno od tvoje implementacije.

        return redirect(url_for('dashboard'))
    return render_template('add_transaction.html')

# Odjava korisnika
@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('user_name', None)
    session.pop('user_role', None)
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
