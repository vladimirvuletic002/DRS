import React, { useState } from 'react';
import NavBar from './NavBar';
import '../styles/Dashboard.css'; // Importuj stilove za Dashboard
import { Line } from 'react-chartjs-2'; // Importuj Line grafikon iz chart.js
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';

// Registracija komponenti za ChartJS
ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

function Dashboard() {
  // U ovom primeru, akcije su predstavljene sa sledećim podacima:
  const [actions, setActions] = useState([
    {
      id: 1,
      name: 'Apple',
      quantity: 50,
      purchasePrice: 130,
      currentPrice: 145,
      transactions: [
        { type: 'buy', quantity: 50, price: 130, date: '2024-01-01' },
        { type: 'sell', quantity: 10, price: 140, date: '2024-02-01' }
      ]
    },
    {
      id: 2,
      name: 'Tesla',
      quantity: 30,
      purchasePrice: 600,
      currentPrice: 620,
      transactions: [
        { type: 'buy', quantity: 30, price: 600, date: '2024-01-05' }
      ]
    }
  ]);

  const [newAction, setNewAction] = useState({ name: '', purchasePrice: 0, quantity: 0 });
  const [newTransaction, setNewTransaction] = useState({ actionId: '', type: '', quantity: 0, price: 0 });

  // Dodavanje nove akcije
  const addAction = () => {
    const newId = actions.length ? actions[actions.length - 1].id + 1 : 1;
    const newActionObject = { ...newAction, id: newId, transactions: [] };
    setActions([...actions, newActionObject]);
    setNewAction({ name: '', purchasePrice: 0, quantity: 0 });
  };

  // Dodavanje nove transakcije (kupovina ili prodaja)
  const addTransaction = () => {
    const updatedActions = actions.map(action => {
      if (action.id === parseInt(newTransaction.actionId)) {
        const updatedTransactions = [...action.transactions, newTransaction];
        return { ...action, transactions: updatedTransactions, quantity: action.quantity + (newTransaction.type === 'buy' ? newTransaction.quantity : -newTransaction.quantity) };
      }
      return action;
    });
    setActions(updatedActions);
    setNewTransaction({ actionId: '', type: '', quantity: 0, price: 0 });
  };

  // Brisanje transakcije
  const deleteTransaction = (actionId, transactionIndex) => {
    const updatedActions = actions.map(action => {
      if (action.id === actionId) {
        const updatedTransactions = action.transactions.filter((_, index) => index !== transactionIndex);
        return { ...action, transactions: updatedTransactions };
      }
      return action;
    });
    setActions(updatedActions);
  };

  // Izračunavanje profita/gubitka po akciji
  const calculateProfitLoss = (action) => {
    let totalProfitLoss = 0;
    action.transactions.forEach(transaction => {
      const transactionProfitLoss = (transaction.type === 'sell') 
        ? (transaction.price - action.purchasePrice) * transaction.quantity
        : 0;
      totalProfitLoss += transactionProfitLoss;
    });
    return totalProfitLoss;
  };

  // Izračunavanje ukupne vrednosti portfolija
  const calculateTotalPortfolioValue = () => {
    let totalValue = 0;
    actions.forEach(action => {
      totalValue += action.quantity * action.currentPrice;
    });
    return totalValue;
  };

  // Izračunavanje ukupnog profita/gubitka
  const calculateTotalProfitLoss = () => {
    let totalProfitLoss = 0;
    actions.forEach(action => {
      totalProfitLoss += calculateProfitLoss(action);
    });
    return totalProfitLoss;
  };

  // Grafikon promena vrednosti akcija tokom vremena
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: actions.map(action => ({
      label: action.name,
      data: action.transactions.map(transaction => transaction.price),
      fill: false,
      borderColor: 'blue',
      tension: 0.1
    }))
  };

  // Grafikon profita/gubitka po akciji
  const profitLossChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: actions.map(action => ({
      label: action.name,
      data: action.transactions.map(transaction => calculateProfitLoss(action)),
      fill: false,
      borderColor: 'green',
      tension: 0.1
    }))
  };

  // Grafikon ukupne vrednosti portfolija
  const totalPortfolioChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Ukupna vrednost portfolija',
        data: [calculateTotalPortfolioValue()],
        fill: false,
        borderColor: 'purple',
        tension: 0.1
      }
    ]
  };

  return (
    <div className="dashboard-container">
      {/* Navigation Bar */}
      

      <h1>Dobrodošli na moj Portfolio</h1>

      <div className="actions">
        <h2>Akcije</h2>
        {actions.map(action => (
          <div key={action.id} className="action-card">
            <h3>{action.name}</h3>
            <p>Količina: {action.quantity}</p>
            <p>Vrednost: ${action.currentPrice}</p>
            <p>Profit/Gubitak: ${calculateProfitLoss(action)}</p>
            <button onClick={() => deleteTransaction(action.id, 0)}>Obriši poslednju transakciju</button>
          </div>
        ))}
      </div>

      <div className="add-action">
        <h3>Dodaj novu akciju</h3>
        <input type="text" value={newAction.name} onChange={e => setNewAction({ ...newAction, name: e.target.value })} placeholder="Ime akcije" />
        <input type="number" value={newAction.purchasePrice} onChange={e => setNewAction({ ...newAction, purchasePrice: e.target.value })} placeholder="Cena kupovine" />
        <input type="number" value={newAction.quantity} onChange={e => setNewAction({ ...newAction, quantity: e.target.value })} placeholder="Količina" />
        <button onClick={addAction}>Dodaj Akciju</button>
      </div>

      <div className="add-transaction">
        <h3>Dodaj transakciju</h3>
        <select value={newTransaction.actionId} onChange={e => setNewTransaction({ ...newTransaction, actionId: e.target.value })}>
          {actions.map(action => (
            <option key={action.id} value={action.id}>{action.name}</option>
          ))}
        </select>
        <select value={newTransaction.type} onChange={e => setNewTransaction({ ...newTransaction, type: e.target.value })}>
          <option value="buy">Kupovina</option>
          <option value="sell">Prodaja</option>
        </select>
        <input type="number" value={newTransaction.quantity} onChange={e => setNewTransaction({ ...newTransaction, quantity: e.target.value })} placeholder="Količina" />
        <input type="number" value={newTransaction.price} onChange={e => setNewTransaction({ ...newTransaction, price: e.target.value })} placeholder="Cena po akciji" />
        <button onClick={addTransaction}>Dodaj Transakciju</button>
      </div>

      <div className="chart-container">
        <h3>Grafikon vrednosti akcija tokom vremena</h3>
        <Line data={chartData} />
      </div>

      <div className="chart-container">
        <h3>Grafikon profita/gubitka</h3>
        <Line data={profitLossChartData} />
      </div>

      <div className="chart-container">
        <h3>Grafikon ukupne vrednosti portfolija</h3>
        <Line data={totalPortfolioChartData} />
      </div>

      <div className="total-value">
        <h3>Ukupna vrednost portfolija: ${calculateTotalPortfolioValue()}</h3>
        <h3>Ukupni profit/gubitak: ${calculateTotalProfitLoss()}</h3>
      </div>
    </div>
  );
}

export default Dashboard;