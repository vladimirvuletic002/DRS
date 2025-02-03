from flask_mysqldb import MySQL
from flask import jsonify, request
import bcrypt

# Funkcija za registraciju korisnika
def create_user(mysql: MySQL, first_name, last_name, address, city, country, phone_number, email, password):
    cursor = mysql.connection.cursor()

    # Provera da li korisnik već postoji u bazi
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    existing_user = cursor.fetchone()
    if existing_user:
        return jsonify({'message': 'Korisnik sa tim emailom već postoji'}), 400

    # Hashiranje lozinke pre nego što je sačuvamo u bazi
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    try:
        # Ubacivanje novog korisnika u bazu
        cursor.execute("""
            INSERT INTO users (first_name, last_name, address, city, country, phone_number, email, password) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (first_name, last_name, address, city, country, phone_number, email, hashed_password))
        mysql.connection.commit()
        return jsonify({'message': 'Uspešno ste registrovani!'}), 201
    except Exception as e:
        mysql.connection.rollback()  # Vraćanje promene u slučaju greške
        return jsonify({'message': str(e)}), 500

# Funkcija za proveru korisničkog prijavljivanja
def check_user_login(mysql: MySQL, email, password):
    cursor = mysql.connection.cursor()

    # Pronalaženje korisnika prema emailu
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()

    if user and bcrypt.checkpw(password.encode('utf-8'), user[7].encode('utf-8')):  # Upoređivanje hashirane lozinke
        return jsonify({'message': 'Uspesno ste se prijavili!'}), 200
    else:
        return jsonify({'message': 'Pogrešan email ili lozinka'}), 400
