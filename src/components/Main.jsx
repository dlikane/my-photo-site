import { Routes, Route } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Slideshow from "./Slideshow";
import Category from "./Category";
import Videos from "./Videos";
import About from "./About";

const Main = ({ theme, setTheme }) => {
    return (
        <div className="flex flex-col min-h-screen">
            <Header theme={theme} setTheme={setTheme} />

            <div className="flex-grow">
                <Routes>
                    <Route path="/" element={<Slideshow />} />
                    <Route path="/category/:categoryName" element={<Category />} />
                    <Route path="/videos/:videoType" element={<Videos />} />
                    <Route path="/about" element={<About />} />
                </Routes>
            </div>

            <Footer />
        </div>
    );
};

export default Main;
