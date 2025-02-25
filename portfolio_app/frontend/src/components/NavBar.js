import React, { useState, useEffect, useRef } from "react";
import "../styles/NavBar.css"; 
import { useNavigate } from "react-router-dom";
import appLogo from '../images/app_logo.png';

const NavBar = ({ isAuthenticated, userEmail, onLogout }) => {
    //const [showLoginModal, setShowLoginModal] = useState(false);
    const navigate = useNavigate(); // Hook za navigaciju
    const [dropdownVisible, setDropdownVisible] = useState(false); // Stanje za prikaz menija
    const dropdownRef = useRef(null); // Ref za pracenje menija

    const handleLogout = async () => {
        try {
            const response = await fetch("http://localhost:5000/logout", {
                method: "POST",
                credentials: "include"
            });
    
            if (response.ok) {
                onLogout();  // Ažuriranje stanja na frontend-u (npr. setIsAuthenticated(false))
                navigate("/");  // Preusmeravanje na početnu stranicu
            } else {
                console.error("Logout failed");
            }
        } catch (error) {
            console.error("Error during logout:", error);
        }
      };

    const handleLoginRedirect = () => {
      navigate("/login"); // Preusmeravanje na Login stranicu
    };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  // Zatvaranje menija klikom van njega
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setDropdownVisible(false); // Zatvaranje menija
        }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
}, []);

  return (
      <nav className="navbar">
          <div className="navbar-container">
              <div className="navbar-logo-container">
                  <div className="navbar-logo" onClick={() => navigate("/")}>
                      <img className="logo" src={appLogo} alt="app_logo" width="40" />
                  </div>
                  <div className="navbar-name" onClick={() => navigate("/")}>
                      Stocks Portfolio
                  </div>
              </div>
              <div className="navbar-links">
                  {isAuthenticated ? (
                      <div className="navbar-user-dropdown" ref={dropdownRef}>
                          <button
                              className="navbar-user-email"
                              onClick={toggleDropdown}
                          >
                              {userEmail}
                          </button>
                          {dropdownVisible && (
                              <div className="dropdown-menu">
                                  <button onClick={() => {navigate("/dashboard"); toggleDropdown();}}>
                                      DashBoard
                                  </button>
                                  <button onClick={() => {navigate("/edit-profile"); toggleDropdown();}}>
                                      Edit Profile
                                  </button>
                                  <button onClick={() => {navigate("/transaction"); toggleDropdown();}}>
                                      Buy/Sell Stocks
                                  </button>
                                  <button className="btn-logout" onClick={handleLogout}>Logout</button>
                              </div>
                          )}
                      </div>
                  ) : (
                      <button
                          onClick={handleLoginRedirect}
                          className="btn-login"
                      >
                          Sign in
                      </button>
                  )}
              </div>
          </div>
      </nav>
  );


};
 
export default NavBar;