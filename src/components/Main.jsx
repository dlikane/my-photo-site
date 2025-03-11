import { useEffect } from "react";
import Header from "./Header";
import Slideshow from "./Slideshow";
import Footer from "./Footer";

const Main = () => {
    useEffect(() => {
        document.title = "With Dmitry Likane"; // ✅ Update tab title
    }, []);

    return (
        <div className="main-container">
            <Header />
            <Slideshow />
            <Footer />
        </div>
    );
};

export default Main;