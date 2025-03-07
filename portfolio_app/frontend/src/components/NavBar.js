import React, { useState, useEffect, useRef } from "react";
import "../styles/NavBar.css";
import { useNavigate, useLocation } from "react-router-dom";
import appLogo from "../images/app_logo.png";
import Papa from "papaparse";

const NavBar = ({ isAuthenticated, userEmail, onLogout }) => {
  //const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate(); // Hook za navigaciju
  const [dropdownVisible, setDropdownVisible] = useState(false); // Stanje za prikaz menija
  const dropdownRef = useRef(null); // Ref za pracenje menija
  const searchDropDownRef = useRef(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [stocks, setStocks] = useState([]);
  const location = useLocation();

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        onLogout(); // Ažuriranje stanja na frontend-u (npr. setIsAuthenticated(false))
        navigate("/"); // Preusmeravanje na početnu stranicu
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

  useEffect(() => {
    setQuery("");
    setSuggestions([]);
  }, [location.pathname]);

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

  const goToChartPage = (symbol) => {
    navigate(`/chart?symbol=${symbol}`);
  };

  useEffect(() => {
    const loadCSV = async () => {
      try {
        const response = await fetch("./listing_status.csv");
        const text = await response.text();
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            setStocks(result.data);
          },
        });
      } catch (error) {
        console.error("Error loading CSV:", error);
      }
    };

    loadCSV();
  }, []);

  // Zatvori meni ako korisnik klikne van njega
  useEffect(() => {
    const handleSearchClickOutside = (event) => {
      if (searchDropDownRef.current && !searchDropDownRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleSearchClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleSearchClickOutside);
    };
  }, []);

  // Filtriraj podatke za autocomplete
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const filteredStocks = stocks
      .filter(
        (stock) =>
          stock.symbol.toLowerCase().startsWith(query.toLowerCase()) ||
          stock.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 10); // Ograničavamo na 10 rezultata

    setSuggestions(filteredStocks);
  }, [query, stocks]);

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

          <div>
            <input
              type="text"
              name="stock-name"
              className="search-box"
              placeholder="Search for symbols"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <ul className="search-autocomplete-list" ref={searchDropDownRef}>
                {suggestions.map((stock, index) => (
                  <li key={index} onClick={() => goToChartPage(stock.symbol)}>
                    {stock.symbol} - {stock.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="navbar-links">
          {isAuthenticated ? (
            <div className="navbar-user-dropdown" ref={dropdownRef}>
              <button className="navbar-user-email" onClick={toggleDropdown}>
                {userEmail}
              </button>
              {dropdownVisible && (
                <div className="dropdown-menu">
                  <button
                    onClick={() => {
                      navigate("/dashboard");
                      toggleDropdown();
                    }}
                  >
                    DashBoard
                  </button>
                  <button
                    onClick={() => {
                      navigate("/edit-profile");
                      toggleDropdown();
                    }}
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate("/transaction");
                      toggleDropdown();
                    }}
                  >
                    Buy/Sell Stocks
                  </button>
                  <button className="btn-logout" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={handleLoginRedirect} className="btn-login">
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
