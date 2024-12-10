import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css'; 

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Uspešno ste prijavljeni!");
        setError("");
        onLogin(email); // Prosledi email roditelju (App.js)
        navigate('/dashboard'); // Preusmeravanje na dashboard
      } else {
        setError(data.error || "Neispravni kredencijali. Pokušajte ponovo.");
        setSuccessMessage("");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Server nije dostupan. Pokušajte kasnije.");
      setSuccessMessage("");
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Lozinka:</label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Prijavi se</button>
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        <p className='register-question'>Ako nemas nalog <span className="register-link" onClick={() => navigate("/register")}>Registruj se.</span></p>
      </form>

      
    </div>
  );
};

export default Login;