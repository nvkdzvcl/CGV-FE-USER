import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import './styles/header.css';
import './styles/footer.css';
import './styles/home.css';
import './styles/movies.css';
import './styles/cinemas.css';
import './styles/promotions.css';
import './styles/seat-booking.css';
import './styles/auth-modal.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);