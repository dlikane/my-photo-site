import { useState, useEffect } from "react";
/* eslint-disable no-unused-vars */
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Menu = ({ theme, setTheme }) => {
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
        setIsOpen(false);
        navigate(path);
    };

/*
    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };
*/

    return (
        <div className="absolute left-5 top-5 z-50">
            <img
                src="/menu.svg"
                className="size-8 cursor-pointer transition-transform hover:scale-110"
                alt="Menu"
                onClick={() => setIsOpen(!isOpen)}
            />
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="absolute left-0 top-12 w-48 rounded-lg bg-white/80 p-4 text-black shadow-lg backdrop-blur-sm dark:bg-black/70 dark:text-white"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ul className="space-y-2">
                            <li className="cursor-pointer hover:text-gray-400" onClick={() => handleNavigate("/")}>welcome</li>
                            {categories.map((category) => (
                                <li key={category} className="cursor-pointer hover:text-gray-400" onClick={() => handleNavigate(`/category/${category}`)}>
                                    {category}
                                </li>
                            ))}
                            {Object.keys(playlists).length > 0 ? (
                                Object.keys(playlists).map((name) => (
                                    <li key={name} className="cursor-pointer hover:text-gray-400" onClick={() => handleNavigate(`/videos/${name}`)}>
                                        {name}
                                    </li>
                                ))
                            ) : (
                                <li className="text-gray-500">Loading...</li>
                            )}
                            <li className="cursor-pointer hover:text-gray-400" onClick={() => window.open("https://instagram.com/dlikane", "_blank")}>
                                contact
                            </li>
                            <li className="cursor-pointer hover:text-gray-400" onClick={() => handleNavigate("/about")}>about</li>
{/*

                            <li className="cursor-pointer hover:text-gray-400 font-bold" onClick={toggleTheme}>
                                {theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
                            </li>

*/}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Menu;
