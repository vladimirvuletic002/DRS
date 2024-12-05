import React, { useState } from 'react';
import '../styles/auth.css'; // Importuj auth.css iz novog direktorijuma

function Register() {
  const [formData, setFormData] = useState({
    ime: '',
    prezime: '',
    adresa: '',
    grad: '',
    drzava: '',
    brojTelefona: '',
    email: '',
    lozinka: ''
  });

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage('Korisnik je uspešno registrovan!');
        setError('');
      } else {
        setError('Došlo je do greške pri registraciji.');
        setSuccessMessage('');
      }
    } catch (error) {
      setError('Server nije dostupan.');
      setSuccessMessage('');
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Registracija</h2>
        <div>
          <label>Ime:</label>
          <input
            type="text"
            name="ime"
            value={formData.ime}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Prezime:</label>
          <input
            type="text"
            name="prezime"
            value={formData.prezime}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Adresa:</label>
          <input
            type="text"
            name="adresa"
            value={formData.adresa}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Grad:</label>
          <input
            type="text"
            name="grad"
            value={formData.grad}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Država:</label>
          <input
            type="text"
            name="drzava"
            value={formData.drzava}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Broj telefona:</label>
          <input
            type="text"
            name="brojTelefona"
            value={formData.brojTelefona}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Lozinka:</label>
          <input
            type="password"
            name="lozinka"
            value={formData.lozinka}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Registruj se</button>
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
      </form>
    </div>
  );
}

export default Register;
