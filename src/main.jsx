import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./styles/index.css"
import "./lib/icons.js"
import App from "./App.jsx"
import { AuthProvider } from "./components/auth/AuthProvider.jsx"

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </StrictMode>
)
