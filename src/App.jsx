import { BrowserRouter as Router } from "react-router-dom";
import Main from "./components/Main";
import { useState, useEffect } from "react";

const App = () => {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

    useEffect(() => {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    return (
        <Router>
            {/* ✅ Tailwind Test Box */}
            <div className="p-4 bg-red-500 text-white text-lg font-bold text-center">
                Tailwind is working!
            </div>

            <Main theme={theme} setTheme={setTheme} />
        </Router>
    );
};

export default App;

