import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCategories, getPlaylists } from "../lib/catalog.js";

const Header = () => {
    const [categories, setCategories] = useState([]);
    const [playlists, setPlaylists] = useState({});
    const location = useLocation();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setCategories(await getCategories());
                setPlaylists(await getPlaylists());
            } catch (err) {
                console.error("Failed to load nav data:", err);
            }
        };

        fetchData();
    }, []);

    const renderNavLink = (label, path, isExact = false) => {
        const current = location.pathname;
        const isActive = isExact ? current === path : current.startsWith(path);

        return (
            <Link
                key={path}
                to={path}
                className={`relative px-3 py-2 uppercase tracking-wide transition-colors whitespace-nowrap ${
                    isActive ? "font-bold text-black dark:text-white" : "text-gray-500 dark:text-gray-400"
                } group text-xs sm:text-sm`}
            >
                {label}
                <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-black transition-all duration-300 group-hover:w-full dark:bg-white"></span>
            </Link>
        );
    };

    return (
        <header className="sticky top-0 z-50 bg-white py-2 text-black shadow-md dark:bg-black dark:text-white">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between px-4 sm:flex-row">
                <div className="text-center sm:text-left">
                    <h1 className="font-title text-2xl lowercase tracking-widest sm:text-3xl">Dmitry · Likane</h1>
                    <p className="text-sm font-light tracking-wide">with</p>
                </div>

                <div className="relative w-full sm:w-auto mt-2 sm:mt-0">
                    <nav
                        className="flex overflow-x-auto sm:overflow-visible gap-3 sm:gap-6 px-2 font-body scrollbar-hide sm:flex-wrap sm:justify-end"
                        style={{
                            maskImage:
                                "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                            WebkitMaskImage:
                                "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                        }}
                    >
                        {renderNavLink("home", "/", true)}

                        {categories.length === 0 ? (
                            <span className="px-3 py-2 text-xs sm:text-sm uppercase tracking-wide text-gray-400 font-body whitespace-nowrap">
                              loading…
                            </span>
                        ) : (
                            categories.map((category) =>
                                renderNavLink(category, `/category/${category}`)
                            )
                        )}

                        {Object.keys(playlists).map((name) =>
                            renderNavLink(name, `/videos/${name}`)
                        )}

                        {renderNavLink("about", "/about")}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
