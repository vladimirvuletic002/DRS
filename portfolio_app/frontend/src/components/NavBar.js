import React from "react";
import "../styles/NavBar.css"; 
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const NavBar = ({ isAuthenticated, onLogout }) => {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const navigate = useNavigate(); // Hook za navigaciju

    const handleLogout = () => {
        onLogout(); // Funkcija za odjavu prosleđena kroz props
      };

    const handleRegisterRedirect = () => {
        navigate("/register"); // Preusmeravanje na /register
    };

    const handleLoginRedirect = () => {
      navigate("/login"); // Preusmeravanje na Login stranicu
  };

    return (
        <nav className="navbar">
          <div className="navbar-container">
            <div className="navbar-logo" onClick={() => navigate("/")}>
              Crypto Portfolio
            </div>
            <div className="navbar-links">
              {isAuthenticated ? (
                <>
                  <button onClick={handleLogout} className="btn btn-logout">
                    Odjavi se
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleLoginRedirect}
                    className="btn btn-login"
                  >
                    Prijavi se
                  </button>
                </>
              )}
            </div>
          </div>
    
          {/* Modal za prijavu */}
          
        </nav>
      );


};
 
export default NavBar;