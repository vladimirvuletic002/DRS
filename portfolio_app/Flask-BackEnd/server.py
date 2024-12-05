from flask import Flask, request, jsonify
from flask_cors import CORS  # Dodaj ovu liniju

app = Flask(__name__)
CORS(app)  # Ova linija omogućava CORS za sve rute

# Dummy users list for testing (replace this with database later)
users = []

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    # Validacija podataka
    if 'ime' not in data or 'email' not in data or 'lozinka' not in data:
        return jsonify({'message': 'Nedostaju obavezna polja.'}), 400

    # Provera da li korisnik već postoji
    for user in users:
        if user['email'] == data['email']:
            return jsonify({'message': 'Korisnik sa tim emailom već postoji.'}), 400

    # Dodaj korisnika u listu (treba da se zameni sa bazom podataka)
    users.append(data)

    return jsonify({'message': 'Korisnik uspešno registrovan!'}), 200


if __name__ == '__main__':
    app.run(debug=True)
