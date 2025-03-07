import React, { useState, useEffect, useRef } from "react";
import "../styles/Transaction.css"; 
import Papa from "papaparse";
import protobuf from "protobufjs";
const { Buffer } = require('buffer/');

function formatPrice(price) {
    return `${price.toFixed(2)}`;
}

//const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
const proxyUrl = 'https://thingproxy.freeboard.io/fetch/';


function Transaction(){

    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [stocks, setStocks] = useState([]);
    const [selectedStock, setSelectedStock] = useState(null);
    const [selectedStockPrice, setSelectedStockPrice] = useState(0);
    const [transactionType, setTransactionType] = useState("buy");
    const [quantity, setQuantity] = useState(0);
    const [transactionDate, setTransactionDate] = useState("");

    const dropdownRef = useRef(null);

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');


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
                    }
                });
            } catch (error) {
                console.error("Error loading CSV:", error);
            }
        };

        loadCSV();

    }, []);

    // Filtriraj podatke za autocomplete
    useEffect(() => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }

        const filteredStocks = stocks
            .filter(stock =>
                stock.symbol.toLowerCase().startsWith(query.toLowerCase()) ||
                stock.name.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 10); // Ograničavamo na 10 rezultata

        setSuggestions(filteredStocks);
    }, [query, stocks]);

    const handleSelect = (symbol, name) => {
        setQuery(`${symbol} - ${name}`); // Prikaz u input polju
        setSelectedStock(symbol);
        setSuggestions([]); // Sakrivanje liste
        setSelectedStockPrice(0);

        //let timeoutId;
        async function getLatestPrice() {
            try {
                const stocksUrl = `${proxyUrl}https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
                const response = await fetch(stocksUrl);
                const data = await response.json();
                console.log(data);
                const marketData = data.chart.result[0];
                setSelectedStockPrice(marketData.meta.regularMarketPrice.toFixed(2));
                } catch (error) {
                console.log(error);
                }
                //timeoutId = setTimeout(getLatestPrice, 15000);
        }

        getLatestPrice();

        //clearTimeout(timeoutId);

    };

        

    // Zatvori meni ako korisnik klikne van njega
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setSuggestions([]);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Funkcija za automatsko brisanje poruka
    const clearMessages = () => {
        setTimeout(() => {
            setError('');
            setSuccessMessage('');
        }, 6000);
    };

    // Slanje transakcije na backend
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!selectedStock) {
            alert("Please select a stock.");
            return;
        }

        const transactionData = {
            stock_name: query,
            transaction_type: transactionType,
            quantity: parseInt(quantity, 10),
            price: parseFloat(selectedStockPrice),
            date: transactionDate
        };

        try {
            const response = await fetch('http://localhost:5000/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage("Transaction successful!");
                setError('');
            } else {
                setError(data.error || 'Transaction failed!');
                setSuccessMessage('');
            }
            clearMessages();
        } catch (error) {
            setError("Error submitting transaction:", error);
            setSuccessMessage('');
            clearMessages(); 
        }
    };

    return(
        <div className="page-container">
            <div className="transaction-container">
            <h1 className="h1-edit">Buy/Sell Stocks</h1>

            <form className="transaction-form" onSubmit={handleSubmit}>
                <label>Stock name: </label>

                <div>
                    
                        <input 
                            type="text"
                            name="stock-name"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            required
                            autoComplete="off"
                        />
                        {suggestions.length > 0 && (
                            <ul className="autocomplete-list" ref={dropdownRef}>
                                {suggestions.map((stock, index) => (
                                    <li key={index} onClick={() => handleSelect(stock.symbol, stock.name)}>
                                        {stock.symbol} - {stock.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                </div>
                    
                <label>Action: </label>

                <div>
                
                <select className="options" name="options" id="options" 
                value={transactionType} 
                onChange={(e) => setTransactionType(e.target.value)}
                required>
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                </select>
                </div>

                <label>Transaction Date: </label>

                <div>
                
                    <input
                    type="date"
                    name="transaction-date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    required
                    />
                </div>
                
                <label>Transaction Quantity: </label>

                <div>
                    <input
                    type="number"
                    name="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    />     
                </div>
                
                <label>Transaction Value: </label>

                <div>
                
                        <input
                        type="number"
                        name="value"
                        value={selectedStockPrice}
                        onChange={(e) => setSelectedStockPrice(e.target.value)}
                        readOnly
                        />
                    
                    
                </div>
                

                <button type="submit">Submit Transaction</button>
                
                {error && <p className="tr-error-message">{error}</p>}
                {successMessage && <p className="tr-success-message">{successMessage}</p>}

            </form>
            </div>
        </div>
    );

};

export default Transaction;