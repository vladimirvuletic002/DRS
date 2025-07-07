import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import "../styles/Home.css";
import "../styles/Home.css";
import { Sparklines, SparklinesLine, SparklinesSpots } from "react-sparklines";

//const proxyUrl = "https://cors-anywhere.herokuapp.com/";
const proxyUrl = "https://thingproxy.freeboard.io/fetch/";
//const proxyUrl = "https://api.allorigins.win/raw?url=";

function Home() {
  const navigate = useNavigate();
  const [stockPrices, setStockPrices] = useState({
    AAPL: 0,
    TSLA: 0,
    NVDA: 0,
    GME: 0,
    NIO: 0,
    LCID: 0,
  });
  const [prevPrices, setPrevPrices] = useState({
    AAPL: 0,
    TSLA: 0,
    NVDA: 0,
    GME: 0,
    NIO: 0,
    LCID: 0,
  });

  const [sparkHistory, setSparkHistory] = useState({
  	AAPL: [],
  	TSLA: [],
  	NVDA: [],
  	GME: [],
  	NIO: [],
  	LCID: [],
  })

  const [stockNames, setStockNames] = useState({});

  const homeStocks = ["AAPL", "TSLA", "NVDA", "GME", "NIO", "LCID"];

  const goToChartPage = (symbol) => {
    navigate(`/chart?symbol=${symbol}`);
  };

  /* useEffect(() => {
  	const response = await fetch('http://localhost:5000/login'), {
  	method: 'POST',
  	headers: {}	
  	}
  }, []); */
	
  useEffect(() => {
    let timeoutId;
    async function getLatestPrice() {
      const prices = {};
      const names = {};
      setPrevPrices(prev => ({ ...prev, ...stockPrices }));
      try {
        //for (const symbol of homeStocks) {
		for(let i=0; i<homeStocks.length; i++){
          
		  const symbol = homeStocks[i];
		  const stocksUrl = `${proxyUrl}https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
		  //const stocksUrl = `http://localhost:5000/price/${symbol}`;
		  // Pauza između zahteva (npr. 800ms)
		  await new Promise(res => setTimeout(res, 800));
          const response = await fetch(stocksUrl);
          const data = await response.json();
          
          console.log(data);
          if (data.chart && data.chart.result) {
            const marketData = data.chart.result[0];
            const currentPrice = parseFloat(marketData.meta.regularMarketPrice).toFixed(2);
            const fullName = marketData.meta.longName;
            prices[symbol] = currentPrice;
            names[symbol] = fullName;
            setSparkHistory(prevHistory => ({
              ...prevHistory, 
              [symbol]: [...prevHistory[symbol], currentPrice].slice(-20)
            }));
          }
        }

        setStockNames(names);
        setStockPrices(prices);
      } catch (error) {
        console.log(error);
      }
      timeoutId = setTimeout(getLatestPrice, 15000);
    }

    getLatestPrice();

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="home-container">
      <div className="stocks-container">
        <h1 className="h1-welcome">
          Welcome to the Stocks Portfolio Home page!
        </h1>
        <div className="tickers-container">
          {homeStocks.map((symbol) => (
            <div key={symbol} className="tick-container">
              <div className="tick-info">
                <p className="tick-s" onClick={() => goToChartPage(symbol)}>{symbol}</p>
                <p className="tick-n">{stockNames[symbol]}</p>
              </div>

			  <div className="sparkline-container">
			            <Sparklines data={sparkHistory[symbol]}>
			              <SparklinesLine
			                color={
			                  sparkHistory[symbol]?.[0] <= sparkHistory[symbol]?.[sparkHistory[symbol].length - 1]
			                    ? "teal"
			                    : "red"
			                }
			              />
			              <SparklinesSpots
			                style={{
			                  fill:
			                    sparkHistory[symbol]?.[0] <= sparkHistory[symbol]?.[sparkHistory[symbol].length - 1]
			                      ? "teal"
			                      : "red",
			                }}
			              />
			            </Sparklines>
			          </div>

              <p
                className="tick-p"
                style={{
                  backgroundColor: sparkHistory[symbol]?.[0] <= sparkHistory[symbol]?.[sparkHistory[symbol].length - 1] ? "teal" : "red"
                }}
              >
                {stockPrices[symbol]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
