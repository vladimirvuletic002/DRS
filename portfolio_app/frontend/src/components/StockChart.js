import React, { useEffect, useState } from "react";
import { ResponsiveContainer } from "recharts";
import { useSearchParams } from "react-router-dom";
import Chart from "react-apexcharts";
import "../styles/StockPage.css";

const API_KEY = "EH3ZN5R3IR7N4KHP";

const round = (number) => {
  const num = parseFloat(number);
  return !isNaN(num) ? +num.toFixed(2) : null;
};

const chart = {
  options: {
    chart: {
      type: "candlestick",
      height: 350,
      
    },
    title: {
      text: "CandleStick Chart",
      align: "left",
      style: {
        color: "#ffffff", // Bela boja naslova
      },
    },
    xaxis: {
      type: "datetime",
      labels: {
        style: {
          colors: "#ffffff", // Bela boja za datume na x-osi
        },
      },
    },
    yaxis: {
      tooltip: {
        enabled: true,
      },
      labels: {
        style: {
          colors: "#ffffff", // Bela boja za vrednosti na y-osi
        },
      },
    },
    tooltip: {
      theme: "dark", // Tamni tooltip
      style: {
        fontSize: "14px",
        color: "#ffffff", // Bela boja teksta unutar tooltip-a
      },
      x: {
        show: true,
        format: "dd MMM yyyy",
      },
    },
    grid: {
      borderColor: "#444", // Tamnija mreža za bolji kontrast
    },
  },
};

const StockChart = () => {
  const [series, setSeries] = useState([
    {
      data: [],
    },
  ]);
  const [searchParams] = useSearchParams();
  const symbol = searchParams.get("symbol");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // API poziv za dnevne cene akcije
        const response = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`
        );
        const result = await response.json();

        if (result["Time Series (Daily)"]) {
          const timeSeries = result["Time Series (Daily)"];
          const chartData = Object.keys(timeSeries).map((date) => {
            const prices = [
              timeSeries[date]["1. open"],
              timeSeries[date]["2. high"],
              timeSeries[date]["3. low"],
              timeSeries[date]["4. close"],
            ];

            //console.log("Prices for", date, prices);

            return {
              x: date,
              y: prices.map(round),
            };
          });

          setSeries([
            {
              data: chartData,
            },
          ]);
        } else {
          throw new Error("Nema podataka za ovu akciju.");
        }
      } catch (error) {
        console.error("API fetch error:", error);
        setError("Došlo je do greške pri učitavanju podataka!");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  if (loading) {
    return <div>Loading data...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="stock-page-container">
      <div className="stock-data-view">
        <h2 className="text-xl font-bold mb-4">{symbol} - Chart</h2>
        <ResponsiveContainer width="100%" height={450}>
          <Chart 
            options={chart.options}
            series={series}
            type="candlestick"
            width="100%"
            height={320}
          />
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChart;
