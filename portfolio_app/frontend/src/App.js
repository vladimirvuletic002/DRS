import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useState, useEffect } from "react";
import Register from './components/Register';
import Login from './components/Login';
import NavBar from './components/NavBar';
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import EditProfile from './components/EditProfile';
import Transaction from './components/Transaction';
import StockChart from './components/StockChart';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");


  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated");
    const storedEmail = localStorage.getItem("userEmail");

    if (storedAuth === "true") {
      setIsAuthenticated(true);
      setUserEmail(storedEmail);
    }


  }, []);

  const handleLogin = (email) => {
    setIsAuthenticated(true);
    setUserEmail(email);

    // cuvanje stanja u localStorage
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userEmail", email);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail("");

    // Brisanje stanja iz localStorage
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
  };
  
  return (
    <Router>

      <NavBar
              isAuthenticated={isAuthenticated}
              userEmail={userEmail}
              onLogout={handleLogout}
      />


      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Home /> } />
        <Route path="/" element={<Home />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/transaction" element={<Transaction/>} />
        <Route path="/chart" element={<StockChart/>} />
      </Routes>

    </Router>
  );
}

export default App;
