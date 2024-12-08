from flask import Flask
from flask_mysqldb import MySQL

def init_app(app: Flask):
    # Konfiguracija baze podataka
    app.config['MYSQL_HOST'] = 'localhost'  # IP adresa servera, npr. localhost
    app.config['MYSQL_USER'] = 'root'  # MySQL korisnik
    app.config['MYSQL_PASSWORD'] = 'Shadow2002'  # Lozinka za MySQL korisnika
    app.config['MYSQL_DB'] = 'portfolio_db'  # Ime baze podataka
    
    # Inicijalizacija MySQL-a
    mysql = MySQL(app)
    
    return mysql
