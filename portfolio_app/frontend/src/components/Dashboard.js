import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css"; // Importuj stilove za Dashboard
import { Sparklines, SparklinesLine, SparklinesSpots } from "react-sparklines";
import Popup from 'reactjs-popup';


//const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
//const proxyUrl = "https://thingproxy.freeboard.io/fetch/";
const proxyUrl = "https://api.allorigins.win/raw?url=";

const round = (number) => {
  return number ? +number.toFixed(2) : null;
};

/*function formatPrice(price) {
  return `${price.toFixed(2)}`;
} */

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
  const [stockStyles, setStockStyle] = useState({});
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sort, setSort] = useState({ key: 'SYMBOL', direction: "asc" });

  const [selectedStock, setSelectedStock] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const token = localStorage.getItem("token");

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

  const headers = [
    {
      id: 1,
      KEY: "symbol",
      LABEL: "Symbol",
    },
    {
      id: 2,
      KEY: "quantity",
      LABEL: "Quantity",
    },
    {
      id: 3,
      KEY: "LATEST_PRICE",
      LABEL: "Latest Price",
    },
    {
      id: 4,
      KEY: "average_price",
      LABEL: "Avg. Price",
    },
    {
      id: 5,
      KEY: "P/L",
      LABEL: "Profit/Loss",
    },
    {
      id: 6,
      KEY: "P/L%",
      LABEL: "P/L %",
    }, 
  ];

  useEffect(() => {
    // Fetch user data from the server
    fetch(`${process.env.REACT_APP_API_URL}/funds`, { 
    	method: "GET",
    	headers: {
    	"Authorization": `Bearer ${token}`, 
    	"Content-Type": "application/json",
    	},     
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

	

  const confirmDelete = async () => {
    if (!selectedStock) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-stock`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbol: selectedStock.symbol }),
      });

      const data = await response.json();

      if (response.ok) {
        setUserStocks(prev => prev.filter(s => s.symbol !== selectedStock.symbol));
      }
    } catch (error) {
      console.error("Greška prilikom brisanja akcije:", error);
    }

    setIsModalOpen(false);
    setSelectedStock(null);
  };

  // Slanje transakcije na backend
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (buyPower > 0) {
      const dataForFunds = {
        buy_power: parseFloat(buyPower),
      };

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/add-funds`, {
          method: "POST",
          headers: { 
			"Authorization": `Bearer ${token}`,
          	"Content-Type": "application/json" },
          body: JSON.stringify(dataForFunds),
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
	const token = localStorage.getItem("token");
    fetch(`${process.env.REACT_APP_API_URL}/get-stocks`, {
    	method: "GET",
    	headers: {
    	"Authorization": `Bearer ${token}`, 
    	"Content-Type": "application/json",
    	},
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

  //za profit/gubitak
  useEffect(() => {
    const calculateStyles = () => {
      const styles = {};
      userStocks.forEach((stock) => {  
        const profitLoss = ((stockPrices[stock.symbol] - stock.average_price) * stock.quantity).toFixed(2);
        const profitLossPercentage = (((stockPrices[stock.symbol] - stock.average_price) * stock.quantity * 100) / (stockPrices[stock.symbol] * stock.quantity)).toFixed(2);
  
        styles[stock.symbol] = {
          profitLossStyle: profitLoss >= 0 ? { color: "teal" } : { color: "red" },
          profitLossValue: profitLoss > 0 ? +profitLoss : profitLoss,
          profitLossPercentageStyle: profitLossPercentage >= 0 ? { color: "teal" } : { color: "red" },
          profitLossPercentageValue: profitLossPercentage > 0 ? +profitLossPercentage : profitLossPercentage,
        };
      });
      setStockStyle(styles);
    };
  
    calculateStyles();
  }, [stockPrices, userStocks]);
  
  function handleHeaderClick(header) {
   setSort({
    key: header.KEY,
    direction:
      header.KEY === sort.key ? sort.direction === "asc" ? "desc" : "asc" : "desc",
  });
  }

  function getSortedStocks(stocksToSort){

    /*if(sort.direction === "asc"){
      return stocksToSort.sort((a,b) => (a[sort.key] > b[sort.key] ? 1 : -1));
    }
    return stocksToSort.sort((a,b) => (a[sort.key] > b[sort.key] ? -1 : 1)); */
    return [...stocksToSort].sort((a, b) => {
    let valA = a[sort.key];
    let valB = b[sort.key];

    // Ako sortiramo po ceni, koristimo stockPrices objekat
    if (sort.key === "LATEST_PRICE") {
      valA = parseFloat(stockPrices[a.symbol] || 0);
      valB = parseFloat(stockPrices[b.symbol] || 0);
    }

    if(sort.key === "P/L"){
    	valA = parseFloat(stockStyles[a.symbol].profitLossValue || 0);
    	valB = parseFloat(stockStyles[b.symbol].profitLossValue || 0);
    }

    if(sort.key === "P/L%"){
        	valA = parseFloat(stockStyles[a.symbol].profitLossPercentageValue || 0);
        	valB = parseFloat(stockStyles[b.symbol].profitLossPercentageValue || 0);
    }

    if (valA === undefined || valA === null) valA = 0;
    if (valB === undefined || valB === null) valB = 0;

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    return sort.direction === "asc" ? (valA > valB ? 1 : -1) : (valA > valB ? -1 : 1);
  });
  }

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
          className="sparkline-container">
          
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
            <tbody>
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
            </tbody>
          </table>
        </form>

        <table className="buy-power-labels">
          <tbody>
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
          </tbody>
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
	      {headers.map((header,index) => (
                <th key={index} onClick={() => handleHeaderClick(header)}>
		  <span>{header.LABEL}</span>
		  <span className="sort-direction-icon"> {sort.key === header.KEY && (sort.direction === 'asc' ? "▲" : "▼")}</span>
		</th>
	      ))}
	    </tr>
          </thead>
          <tbody>
            {getSortedStocks(filteredStocks).map((stock) => (
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
                
                <td style={stockStyles[stock.symbol]?.profitLossStyle}>
                        {stockStyles[stock.symbol]?.profitLossValue}
                </td>
                <td style={stockStyles[stock.symbol]?.profitLossPercentageStyle}>
                        {stockStyles[stock.symbol]?.profitLossPercentageValue} %
                </td>
                <td>
                	
                  <button
                    className="button"
                    onClick={() => {
                      setSelectedStock(stock);
                      setIsModalOpen(true);
                    }}
                  >
                    Delete
                  </button>
                					
				                  
                </td>
              </tr>

            ))}
          </tbody>
        </table>

            <Popup open={isModalOpen} onClose={() => setIsModalOpen(false)} modal nested>
                  {(close) => (
                    <div className="modal">
                      <button className="close" onClick={close}>
                        &times;
                      </button>
                      <div className="header">Confirm Delete</div>
                      <div className="content">
                        Are you sure you want to delete{" "}
                        <strong>{selectedStock?.symbol}</strong>?
                      </div>
                      <div className="actions">
                        <button
                          className="yesButton"
                          onClick={() => {
                            confirmDelete();
                            close();
                          }}
                        >
                          Yes
                        </button>
                        <button
                          className="button"
                          onClick={() => {
                            setIsModalOpen(false);
                            setSelectedStock(null);
                            close();
                          }}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  )}
                </Popup>

      </div>
    </div>
  );
}

export default Dashboard;
