import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useState } from "react";
import Register from './components/Register';
import Login from './components/Login';
import NavBar from './components/NavBar';
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const handleLogin = (email) => {
    setIsAuthenticated(true);
    setUserEmail(email);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail("");
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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Home />} />
      </Routes>

    </Router>
  );
}

export default App;
