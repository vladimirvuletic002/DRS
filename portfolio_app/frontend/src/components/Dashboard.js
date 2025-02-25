import React, { useEffect, useState } from 'react';
import NavBar from './NavBar';
import '../styles/Dashboard.css'; // Importuj stilove za Dashboard
import { Line } from 'react-chartjs-2'; // Importuj Line grafikon iz chart.js
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
import axios from 'axios';

import protobuf from 'protobufjs';

const { Buffer } = require('buffer/');

// Registracija komponenti za ChartJS
ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);





function Dashboard() {
  const [stocks,setStocks] = useState({});
  useEffect(() => {
    const ws = new WebSocket('wss://streamer.finance.yahoo.com');
    protobuf.load('./YPricingData.proto', (error,root) => {
      if(error){
        return console.log(error);
      }
      
      const Yaticker = root.lookupType("yaticker");

      ws.onopen = function open() {
        console.log('connected');
        ws.send(JSON.stringify({
          subscribe: ['AAPL', 'GOOG', 'TSLA', 'MSFT', 'AMZN']
        }));
      };

      ws.onclose = function close() {
        console.log('disconnected');
      };

      ws.onmessage = function incoming(message) {
        const data = Yaticker.decode(new Buffer(message.data, 'base64'));
        console.log(data);
        
        // Ažuriranje state-a: dodajemo ili ažuriramo podatke za primljeni ticker
        setStocks(prevStocks => ({
          ...prevStocks,
          [data.id]: data // 'id' je ticker simbol, npr. 'AAPL'
        }));
      };

    });

    //return () => {
      //ws.close(); // Zatvori konekciju pri unmount-u
    //};

  }, []);

  return (
    <div>
      <h1>Stock Prices:</h1>
      {Object.entries(stocks).map(([ticker, info]) => (
        <h2 key={ticker}>{ticker}: {info.price}</h2>
      ))}
      
    </div>
  );
  
}

export default Dashboard;