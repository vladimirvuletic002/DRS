from flask import Flask
from flask_mysqldb import MySQL

def init_app(app: Flask):
    # Konfiguracija baze podataka
    app.config['MYSQL_HOST'] = 'localhost'  # IP adresa servera
    app.config['MYSQL_USER'] = 'vladimir002'  # MySQL korisnik
    app.config['MYSQL_PASSWORD'] = '1234'  # Lozinka za MySQL korisnika
    app.config['MYSQL_DB'] = 'portfolio_app'  
    
    # Inicijalizacija MySQL-a
    mysql = MySQL(app)
    
    return mysql
