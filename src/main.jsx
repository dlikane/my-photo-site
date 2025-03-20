import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css'; // ✅ Import global styles
import App from './App.jsx';
import "./styles/themeNight.css";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
