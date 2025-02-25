import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import za navigaciju
import '../styles/auth.css'; 

function Register() {
  const navigate = useNavigate(); // Hook za navigaciju

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    password: '',
    potvrda: '',
  });

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearMessages = () => {
    setTimeout(() => {
        setError('');
        setSuccessMessage('');
    }, 6000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Korisnik je uspešno registrovan!');
        setError('');
        // Preusmeravanje na stranicu za prijavu nakon 2 sekunde
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || 'Došlo je do greške pri registraciji.');
        setSuccessMessage('');
        clearMessages();
      }
    } catch (error) {
      setError('Server nije dostupan. Pokušajte kasnije.');
      setSuccessMessage('');
      clearMessages();
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="classReg">Registration</h2>

        <div>
          <label>Name:</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Surname:</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Address:</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>City:</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Country:</label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Mobile number:</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
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
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8} // Minimalna dužina lozinke
          />
        </div>

        <div>
          <label>Confirm password:</label>
          <input
            type="password"
            name="potvrda"
            value={formData.potvrda}
            onChange={handleChange}
            required
            minLength={8} // Minimalna dužina lozinke
          />
        </div>

        <button type="submit">Sign up</button>

        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
      </form>
    </div>
  );

}

export default Register;
