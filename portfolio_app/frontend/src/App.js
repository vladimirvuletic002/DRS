import React from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
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
	const fetchUserData = async () => {
		const token = localStorage.getItem("token");

		if (!token) {
			setIsAuthenticated(false);
			return;
		}

		const response = await fetch(`${process.env.REACT_APP_API_URL}/user`, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${token}`  // �� Slanje tokena u headeru
			}
		});

		if (response.ok) {
			const data = await response.json();
			setIsAuthenticated(true);
			setUserEmail(data.email);
		} else {
			setIsAuthenticated(false);
		}
	};

	fetchUserData();
  }, []); 


  

  const handleLogin = (email,token) => {
    localStorage.setItem("token", token); 
    setIsAuthenticated(true);
    setUserEmail(email);
  };


  

  const handleLogout = () => {
    localStorage.removeItem("token");  // �� Brišemo token
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
        <Route path="/register" element={isAuthenticated ? <Home /> : <Register />} />
        <Route path="/login" element={isAuthenticated ? <Home /> : <Login onLogin={handleLogin} />} />
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
