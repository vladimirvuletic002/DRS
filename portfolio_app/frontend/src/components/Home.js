import React from "react";
import NavBar from "./NavBar";  
import '../styles/Home.css';

const Home = () => {
    return (
      <div>
        
        
        
        {/* Sadržaj stranice */}
        <div className="home-container">
          <h1>Dobrodošli na stranicu Portfolio Akcija!</h1>
          <p>
            Ovde ce biti prikazane neke od postojecih akcija.
          </p>
        </div>
      </div>
    );
  };

export default Home;