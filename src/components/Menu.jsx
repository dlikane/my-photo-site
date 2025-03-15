import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Menu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [playlists, setPlaylists] = useState({}); // ✅ Playlists now stored as an object
    const navigate = useNavigate();

    useEffect(() => {
        // ✅ Fetch categories from Dropbox
        axios.get("/api/categories")
            .then((res) => setCategories(res.data))
            .catch((err) => console.error("❌ Error fetching categories:", err));

        // ✅ Fetch playlists from Dropbox
        axios.get("/api/playlists")
            .then((res) => setPlaylists(res.data))
            .catch((err) => {
                console.error("❌ Error fetching playlists:", err);
                setPlaylists({}); // ✅ Prevents infinite "Loading..."
            });
    }, []);

    const handleNavigate = (path) => {
        console.log(`🔗 Navigating to: ${path}`);
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

                            {/* ✅ Videos (Dynamically Loaded from API) */}
                            <li className="submenu-title">Videos</li>
                            <ul className="submenu">
                                {Object.keys(playlists).length > 0 ? (
                                    Object.keys(playlists).map((name) => (
                                        <li
                                            key={name}
                                            className="menu-item"
                                            onClick={() => handleNavigate(`/videos/${name}`)}
                                        >
                                            {name}
                                        </li>
                                    ))
                                ) : (
                                    <li className="menu-item disabled">Loading...</li> // ✅ Show loading state
                                )}
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
