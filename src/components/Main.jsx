import { Routes, Route } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Slideshow from "./Slideshow";
import Category from "./Category";
import Videos from "./Videos";
import About from "./About";
import Hidden from "./Hidden";

const Main = ({ theme, setTheme }) => {
    return (
        <div className="flex h-screen flex-col">
            <Header theme={theme} setTheme={setTheme} />
            <main className="grow overflow-auto scrollbar-hide bg-white dark:bg-black">
                <Routes>
                    <Route path="/" element={<Slideshow />} />
                    <Route path="/category/*" element={<Category />} />
                    <Route path="/videos/:playlist" element={<Videos />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/hidden" element={<Hidden />} />
                </Routes>
            </main>
            <Footer />
        </div>
    );
};

export default Main;
