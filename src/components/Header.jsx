import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getCategories, getPlaylists } from "../lib/catalog.js";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

const Header = () => {
    const [categories, setCategories] = useState([]);
    const [playlists, setPlaylists] = useState({});
    const navRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
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

    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;

        const handleScroll = () => {
            setCanScrollLeft(nav.scrollLeft > 10);
            setCanScrollRight(nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 10);
        };

        handleScroll();
        nav.addEventListener("scroll", handleScroll);
        return () => nav.removeEventListener("scroll", handleScroll);
    }, [categories, playlists]);

    const scrollBy = (amount) => {
        navRef.current?.scrollBy({ left: amount, behavior: "smooth" });
    };

    const renderNavLink = (label, path, isExact = false) => (
        <NavLink
            to={path}
            className={({ isActive }) =>
                `relative px-3 py-2 text-xs sm:text-sm uppercase tracking-wide transition-colors ${
                    isActive && isExact ? "font-bold text-black dark:text-white" : "text-gray-500 dark:text-gray-400"
                } group`
            }
            end={isExact}
        >
            {label}
            <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-black transition-all duration-300 group-hover:w-full dark:bg-white"></span>
        </NavLink>
    );

    return (
        <header className="sticky top-0 z-50 bg-white py-2 text-black shadow-md dark:bg-black dark:text-white">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between px-4 sm:flex-row">
                <div className="text-center sm:text-left">
                    <h1 className="font-title text-2xl lowercase tracking-widest sm:text-3xl">Dmitry · Likane</h1>
                    <p className="text-sm font-light tracking-wide">with</p>
                </div>

                <div className="relative mt-2 w-full overflow-hidden sm:mt-0 sm:w-auto">
                    {/* Arrows only on mobile */}
                    {canScrollLeft && (
                        <button
                            onClick={() => scrollBy(-100)}
                            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 px-2 transition-transform hover:scale-125 sm:hidden"
                        >
                            <ChevronLeftIcon className="h-5 w-5 text-black dark:text-white" />
                        </button>
                    )}
                    {canScrollRight && (
                        <button
                            onClick={() => scrollBy(100)}
                            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 px-2 transition-transform hover:scale-125 sm:hidden"
                        >
                            <ChevronRightIcon className="h-5 w-5 text-black dark:text-white" />
                        </button>
                    )}

                    {/* Fade masks */}
                    <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white dark:from-black sm:hidden" />
                    <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white dark:from-black sm:hidden" />

                    <nav
                        ref={navRef}
                        className="flex max-w-full flex-nowrap overflow-x-auto sm:flex-wrap sm:justify-end scrollbar-hide text-xs sm:text-sm font-body"
                    >
                        {renderNavLink("home", "/", true)}

                        {categories.length === 0 ? (
                            <span className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">loading…</span>
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
