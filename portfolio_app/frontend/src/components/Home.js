import React from "react";
import NavBar from "./NavBar";  

const Home = () => {
    return (
      <div>
        {/* Navigation Bar */}
        <NavBar isAuthenticated={false} /> {/* Podešavanje za demo, promeni ako je potrebno */}
        
        {/* Sadržaj stranice */}
        <div className="home-container">
          <h1>Dobrodošli na stranicu Crypto!</h1>
          <p>
            Pregledajte naše aktivne letove i istražite različite opcije koje nudimo.
            Ako želite da rezervišete let, prijavite se ili registrujte.
          </p>
        </div>
      </div>
    );
  };

export default Home;