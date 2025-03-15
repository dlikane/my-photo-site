import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Menu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("/api/categories")
            .then((res) => setCategories(res.data))
            .catch((err) => console.error("❌ Error fetching categories:", err));
    }, []);

    const handleNavigate = (path) => {
        setIsOpen(false);
        navigate(path);
    };

    return (
        <div className="menu-container">
            {/* ✅ Menu Icon */}
            <img
                src="/menu.svg"
                className="menu-icon"
                alt="Menu"
                onClick={() => setIsOpen(!isOpen)}
            />

            {/* ✅ Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="dropdown-menu"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ul>
                            {/* ✅ Home */}
                            <li className="menu-item" onClick={() => handleNavigate("/")}>Home</li>

                            {/* ✅ Categories (Not Clickable) */}
                            <li className="submenu-title">Categories</li>
                            <ul className="submenu">
                                {categories.map((category) => (
                                    <li key={category} className="menu-item" onClick={() => handleNavigate(`/category/${category}`)}>
                                        {category}
                                    </li>
                                ))}
                            </ul>

                            {/* ✅ Videos (Not Clickable) */}
                            <li className="submenu-title">Videos</li>
                            <ul className="submenu">
                                <li className="menu-item" onClick={() => handleNavigate(`/videos/music-videos`)}>music videos</li>
                                <li className="menu-item" onClick={() => handleNavigate(`/videos/dance-videos`)}>dance videos</li>
                            </ul>

                            {/* ✅ Contact (Opens Instagram Messenger) */}
                            <li className="menu-item" onClick={() => window.open("https://instagram.com/dlikane", "_blank")}>
                                Contact
                            </li>

                            {/* ✅ About */}
                            <li className="menu-item" onClick={() => handleNavigate("/about")}>About</li>
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Menu;
