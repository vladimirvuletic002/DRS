import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import "../styles/Dashboard.css"; // Importuj stilove za Dashboard
import { Line } from "react-chartjs-2"; // Importuj Line grafikon iz chart.js
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";
import { Sparklines, SparklinesLine, SparklinesSpots } from "react-sparklines";
import Chart from "react-apexcharts";

import protobuf from "protobufjs";

const { Buffer } = require("buffer/");

// Registracija komponenti za ChartJS
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
);

//const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
const proxyUrl = "https://thingproxy.freeboard.io/fetch/";

const chart = {
  options: {
    chart: {
      type: "candlestick",
      height: 350,
    },
    title: {
      text: "CandleStick Chart",
      align: "left",
    },
    xaxis: {
      type: "datetime",
    },
    yaxis: {
      tooltip: {
        enabled: true,
      },
    },
  },
};

const round = (number) => {
  return number ? +number.toFixed(2) : null;
};

function formatPrice(price) {
  return `${price.toFixed(2)}`;
}

function Dashboard() {
  const [marketValue, setMarketValue] = useState(0);
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [userStocks, setUserStocks] = useState([]);
  const [stockPrices, setStockPrices] = useState({});
  const [buyPower, setBuyPower] = useState(0);
  const [funds, setFunds] = useState(0.0);
  const [cashBalance, setCashBalance] = useState(0);
  const [netValue, setNetValue] = useState(0);
  const [netPL, setNetPL] = useState(0);
  const [filterValue, setFilterValue] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const goToChartPage = (stock) => {
    navigate(`/chart?symbol=${stock.symbol}`);
  };

  // Funkcija za automatsko brisanje poruka
  const clearMessages = () => {
    setTimeout(() => {
      setError("");
      setSuccessMessage("");
    }, 6000);
  };

  const netPercentage = useMemo(() => {
    if (marketValue === 0) return 0;
    return ((netValue * 100) / marketValue);
  }, [marketValue, netValue]);

  const handleFilterChange = (event) => {
    setFilterValue(event.target.value); 
  };

  const filteredStocks = userStocks.filter((stock) =>
    stock.symbol.toLowerCase().includes(filterValue.toLowerCase())  // Filtriranje po simbolu akcije
  );

  // 1. Fetch podataka sa backend-a za ukupnu vrednost pf-a
  /*useEffect(() => {
    fetch('http://localhost:5000/get-portfolio-value', {
      credentials: 'include' // Omogućava slanje sesije
    })
      .then(response => response.json())
      .then(data => setPortfolioValue(data.portfolio_value))
      .catch(error => console.error("Error fetching value:", error));
  }, []); */

  useEffect(() => {
    // Fetch user data from the server
    fetch("http://localhost:5000/funds", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.error) {
          setFunds(data.funds);
          setCashBalance(data.balance);
        }
      })
      .catch((error) => console.error("Error fetching user data:", error));
  }, []);

  // Slanje transakcije na backend
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (buyPower > 0) {
      const dataForFunds = {
        buy_power: parseFloat(buyPower),
      };

      try {
        const response = await fetch("http://localhost:5000/add-funds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataForFunds),
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok) {
          setFunds(data.buy_power);
          setSuccessMessage("Funds added!");
          setError("");
          setBuyPower(0);
        } else {
          setError(data.error || "Transaction failed!");
          setSuccessMessage("");
        }
        clearMessages();
      } catch (error) {
        setError("Error submitting transaction:", error);
        setSuccessMessage("");
        clearMessages();
      }
    } else {
      setError("Enter the amount to add!");
      setSuccessMessage("");
      clearMessages();
    }
  };

  // 2. Fetch podataka sa backend-a
  useEffect(() => {
    fetch("http://localhost:5000/get-stocks", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => setUserStocks(data))
      .catch((error) => console.error("Error fetching user stocks:", error));
  }, []);


  useEffect(() => {
    let timeoutId;
    async function getLatestPrice() {
      const prices = {};
      let newMarketValue = 0;
      let newNetValue = cashBalance;
      let newNetPL = 0;
      try {
        for (const stock of userStocks) {
          const stocksUrl = `${proxyUrl}https://query1.finance.yahoo.com/v8/finance/chart/${stock.symbol}`;
          const response = await fetch(stocksUrl);
          const data = await response.json();
          console.log(data);
          if (data.chart && data.chart.result) {
            const marketData = data.chart.result[0];
            const currentPrice = marketData.meta.regularMarketPrice.toFixed(2);
            prices[stock.symbol] = currentPrice;

            // Ažuriramo portfolio vrednost odmah u petlji
            newMarketValue += stock.quantity * parseFloat(currentPrice);
            newNetValue += stock.quantity * parseFloat(currentPrice);
            newNetPL += parseFloat(stock.quantity *currentPrice) - (stock.quantity *stock.average_price);
          } else {
            console.warn(`No market data for ${stock.symbol}`);
          }
        }

        setStockPrices(prices);
        setMarketValue(newMarketValue);
        setNetValue(newNetValue);
        setNetPL(newNetPL);

        // Dodaj novu vrednost portfolija u istoriju
        setPortfolioHistory((prevHistory) => [
          ...prevHistory.slice(-20),
          newNetValue,
        ]);
      } catch (error) {
        console.log(error);
      }
      timeoutId = setTimeout(getLatestPrice, 20000);
    }

    getLatestPrice();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [userStocks]);

  //TESTIRANJE
  /*useEffect(() => {
    const fetchBatchPrices = async () => {
      try {
        const symbols = userStocks.map(stock => stock.symbol);
        console.log('Sending symbols:', symbols); // <-- Proveri da li ovo izlazi
        const response = await fetch('http://localhost:5000/get-prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols })
        });
        const prices = await response.json();
        setStockPrices(prices);
      } catch (error) {
        console.error('Error fetching batch stock prices:', error);
      }
    };
  
    if (userStocks.length > 0) {
      fetchBatchPrices();
      const interval = setInterval(fetchBatchPrices, 15000*2);
      return () => clearInterval(interval);
    }
  }, [userStocks]); */

  return (
    <div className="dashboard-container">
      <div className="portfolio-value">
        <div className="prvi">
        <label className="label-net-val">Net Account Value</label>
        <h2 className="net-val">
          {netValue.toFixed(2)} $ 
        </h2>
        </div>

        <div className="drugi">
        <label
              className="label-net-profit"
              style={netPL.toFixed(2) >= 0 ? { color: "teal" } : { color: "red" }}
            >
              {netPL > 0 ? `+${netPL.toFixed(2)}` : netPL.toFixed(2)}
            </label>

            <div>
            <label style={netPercentage >= 0 ? {color: "teal"} : {color: "red"}}>{netPercentage > 0 ? `+${netPercentage.toFixed(2)}` : netPercentage.toFixed(2)} %</label>
            </div>
              
        </div>
        

        <div
          className="sparkline-container"
          style={{ width: "500px", height: "200px" }}
        >
          <Sparklines data={portfolioHistory}>
            <SparklinesLine
              color={
                portfolioHistory[portfolioHistory.length - 1] >= 0
                  ? "teal"
                  : "red"
              }
            />
            <SparklinesSpots
              style={{
                fill:
                  portfolioHistory[portfolioHistory.length - 1] >= 0
                    ? "green"
                    : "red",
              }}
            />
          </Sparklines>
        </div>
      </div>

      <div className="portfolio-investment-data">
        <form className="buy-power-form" onSubmit={handleSubmit}>
          <table>
            <tr>
              <td>
                <input
                  type="number"
                  name="buy_power"
                  value={buyPower}
                  onChange={(e) => setBuyPower(e.target.value)}
                  required
                />
              </td>

              <td>
                <button className="funds-button" type="submit">
                  Add funds
                </button>
              </td>

              <td>
                {error && <p className="err-message">{error}</p>}
                {successMessage && (
                  <p className="succ-message">{successMessage}</p>
                )}
              </td>
            </tr>
          </table>
        </form>

        <table>
          <tr>
            <td>
              <label className="label-title">Market Value</label>
            </td>
            <td>
              <label className="label-title">Buying Power</label>
            </td>
            <td>
              <label className="label-title">Cash Balance</label>
            </td>
          </tr>
          <tr>
            <td>
              <label>{marketValue.toFixed(2)} </label>
            </td>
            <td>
              <label>{funds.toFixed(2)}</label>
            </td>
            <td>
              <label>{cashBalance} </label>
            </td>
          </tr>
        </table>
      </div>

      <div className="stocks-view">
        <label className="label-positions">
          My positions ({userStocks.length})
        </label>
        <div className="filter-container">
          <input
            type="text"
            value={filterValue}
            onChange={handleFilterChange}
            placeholder="Filter by symbol..."
            className="filter-input"
          />
        </div>
        <table className="stocks-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Quantity</th>
              <th>Latest Price</th>
              <th>Avg. Price</th>
              <th>Profit/Loss</th>
              <th>P/L %</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.map((stock) => (
              <tr key={stock.symbol}>
                <td
                  onClick={() => goToChartPage(stock)}
                  className="table-symbol-name"
                >
                  {stock.symbol}
                </td>
                <td>{stock.quantity}</td>
                <td>${stockPrices[stock.symbol] || "Loading..."}</td>
                <td>{stock.average_price}</td>
                <td
                  style={
                    round((stockPrices[stock.symbol] - stock.average_price)*stock.quantity) >= 0
                      ? { color: "teal" }
                      : { color: "red" }
                  }
                >
                  {round((stockPrices[stock.symbol] - stock.average_price)*stock.quantity) > 0 ? `+${round((stockPrices[stock.symbol] - stock.average_price) * stock.quantity)}` : round((stockPrices[stock.symbol] - stock.average_price)*stock.quantity)}
                </td>

                <td
                  style={
                    ((stockPrices[stock.symbol] - stock.average_price)*stock.quantity)*100 / (stockPrices[stock.symbol]*stock.quantity) >= 0
                      ? { color: "teal" }
                      : { color: "red" }
                  }
                >
                  {(((stockPrices[stock.symbol] - stock.average_price)*stock.quantity)*100 / (stockPrices[stock.symbol]*stock.quantity)).toFixed(2) > 0 ? `+${(((stockPrices[stock.symbol] - stock.average_price) * stock.quantity * 100) /
      (stockPrices[stock.symbol] * stock.quantity)).toFixed(2)}` : (((stockPrices[stock.symbol] - stock.average_price)*stock.quantity)*100 / (stockPrices[stock.symbol]*stock.quantity)).toFixed(2)} %
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
