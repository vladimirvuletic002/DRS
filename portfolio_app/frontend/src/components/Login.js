import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css'; // Importuj auth.css iz novog direktorijuma

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
    console.log('Form data:', formData);  // Loguj podatke pre slanja

    try {
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
            credentials: 'include'
        });

        console.log('Response status:', response.status);  // Loguj status koda odgovora
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {
            setSuccessMessage(data.message);
            setError('');
            navigate('/dashboard');
        } else {
            setError(data.error);
            setSuccessMessage('');
        }
    } catch (error) {
        console.error('Error:', error);
        setError('Server nije dostupan.');
        setSuccessMessage('');
    }
};


  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Prijavi se</h2>
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
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Prijavi se</button>
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
      </form>
    </div>
  );
}

export default Login;
