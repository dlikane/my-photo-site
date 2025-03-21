import { Routes, Route } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Slideshow from "./Slideshow";
import Category from "./Category";
import Videos from "./Videos";
import About from "./About";

const Main = ({ theme, setTheme }) => {
    return (
        <div className="flex flex-col h-screen">
            <Header theme={theme} setTheme={setTheme} />
            <main className="flex-grow overflow-auto scrollbar-hide">
                <Routes>
                    <Route path="/" element={<Slideshow />} />
                    <Route path="/category/:categoryName" element={<Category />} />
                    <Route path="/videos/:videoType" element={<Videos />} />
                    <Route path="/about" element={<About />} />
                </Routes>
            </main>
            <Footer />
        </div>
    );
};

export default Main;