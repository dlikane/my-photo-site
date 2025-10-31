import { BrowserRouter as Router } from "react-router-dom";
import Main from "./components/Main";
import { useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";

const App = () => {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

    localStorage.removeItem("theme");
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add("light");
    useEffect(() => {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    return (
        <Router>
            <Main theme={theme} setTheme={setTheme} />
            <Analytics debug />
        </Router>
    );
};

export default App;

