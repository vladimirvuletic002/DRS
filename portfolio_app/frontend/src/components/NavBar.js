import React from "react";
import "../styles/NavBar.css"; 
import { useNavigate } from "react-router-dom";

const NavBar = ({ isAuthenticated, userEmail, onLogout }) => {
    //const [showLoginModal, setShowLoginModal] = useState(false);
    const navigate = useNavigate(); // Hook za navigaciju

    const handleLogout = () => {
        onLogout(); // Funkcija za odjavu prosleđena kroz props
        navigate("/");
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
              Portfolio Akcija
            </div>
            <div className="navbar-links">
              {isAuthenticated ? (
                <>
                  <span className="navbar-user-email">{userEmail}</span>
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
    
          
          
        </nav>
      );


};
 
export default NavBar;