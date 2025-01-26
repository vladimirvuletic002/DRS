import React, { useState, useEffect } from "react";
import NavBar from "./NavBar";  
import '../styles/Home.css';

function Home() {
  
  
  return (
      <div className="home-container">
        <div className="stocks-container">
          <h1 className="h1-welcome">Dobrodošli na stranicu Portfolio Akcija!</h1>
          <p>
            Ovde ce biti prikazane neke od postojecih akcija.
          </p>

          </div>
      </div>
    );
  };

export default Home;