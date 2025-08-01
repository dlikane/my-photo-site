import { Routes, Route } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Home from "./Home";
import CategoryRoute from "./CategoryRoute.jsx";
import Videos from "./Videos";
import About from "./About";

const Main = ({ theme, setTheme }) => {
    return (
        <div className="flex h-screen flex-col">
            <Header theme={theme} setTheme={setTheme} />
            <main className="grow overflow-auto scrollbar-hide bg-white dark:bg-black">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/category/:categoryName" element={<CategoryRoute />} />
                    <Route path="/videos/:playlist" element={<Videos />} />
                    <Route path="/about" element={<About />} />
                </Routes>
            </main>
            <Footer />
        </div>
    );
};

export default Main;
