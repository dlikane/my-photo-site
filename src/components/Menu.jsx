import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Menu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [playlists, setPlaylists] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("/api/categories")
            .then((res) => setCategories(res.data))
            .catch((err) => console.error("❌ Error fetching categories:", err));

        axios.get("/api/playlists")
            .then((res) => setPlaylists(res.data))
            .catch((err) => {
                console.error("❌ Error fetching playlists:", err);
                setPlaylists({});
            });
    }, []);

    const handleNavigate = (path) => {
        console.log(`🔗 Navigating to: ${path}`);
        setIsOpen(false);
        navigate(path);
    };

    return (
        <div className="menu-container">
            <img
                src="/menu.svg"
                className="menu-icon"
                alt="Menu"
                onClick={() => setIsOpen(!isOpen)}
            />

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
                            <li className="menu-item" onClick={() => handleNavigate("/")}>home</li>
                            {categories.map((category) => (
                                <li
                                    key={category}
                                    className="menu-item"
                                    onClick={() => handleNavigate(`/category/${encodeURIComponent(category)}`)}
                                >
                                    {category}
                                </li>
                            ))}
                            {Object.keys(playlists).length > 0 ? (
                                Object.keys(playlists).map((name) => (
                                    <li
                                        key={name}
                                        className="menu-item"
                                        onClick={() => handleNavigate(`/videos/${encodeURIComponent(name)}`)}
                                    >
                                        {name}
                                    </li>
                                ))
                            ) : (
                                <li className="menu-item disabled">Loading...</li>
                            )}
                            <li className="menu-item" onClick={() => window.open("https://instagram.com/dlikane", "_blank")}>
                                contact
                            </li>
                            <li className="menu-item" onClick={() => handleNavigate("/about")}>about</li>
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Menu;
