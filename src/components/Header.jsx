import { NavLink } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getCategories, getPlaylists } from "../lib/catalog.js";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

const Header = () => {
    const [categories, setCategories] = useState([]);
    const [playlists, setPlaylists] = useState({});
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const navRef = useRef(null);

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

    const updateScrollIndicators = () => {
        const el = navRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 10);
    };

    useEffect(() => {
        const el = navRef.current;
        if (!el) return;

        updateScrollIndicators();
        el.addEventListener("scroll", updateScrollIndicators);
        window.addEventListener("resize", updateScrollIndicators);

        return () => {
            el.removeEventListener("scroll", updateScrollIndicators);
            window.removeEventListener("resize", updateScrollIndicators);
        };
    }, []);

    useEffect(() => {
        if (categories.length > 0 || Object.keys(playlists).length > 0) {
            // Wait for DOM update
            setTimeout(() => {
                updateScrollIndicators();
            }, 0);
        }
    }, [categories, playlists]);

    const scrollNav = (direction) => {
        const el = navRef.current;
        if (!el) return;
        const amount = el.offsetWidth * 0.6;
        el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
    };

    const renderNavLink = (label, path) => (
        <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
                `relative px-3 py-2 text-xs sm:text-sm uppercase tracking-wide transition-colors ${
                    isActive
                        ? "font-bold text-black dark:text-white"
                        : "text-gray-500 dark:text-gray-400"
                } group`
            }
        >
            {label}
            <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-black transition-all duration-300 group-hover:w-full dark:bg-white"></span>
        </NavLink>
    );

    return (
        <header className="sticky top-0 z-50 bg-white py-2 text-black shadow-md dark:bg-black dark:text-white">
            <div className="mx-auto max-w-7xl px-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:h-24">
                    {/* Branding */}
                    <div className="flex flex-col items-center sm:items-start sm:w-auto sm:mr-6">
                        <div className="relative flex flex-col items-center">
                            <NavLink
                                to="/"
                                className="font-title text-2xl font-extralight lowercase sm:text-3xl transform scale-y-140 sm:tracking-[12px] tracking-[12px] z-10 bg-no-repeat bg-center bg-[length:60%_auto] pb-6 hover:opacity-80 transition-opacity"
                                style={{ backgroundImage: "url('/br.png')" }}
                            >
                                dmitry · likane
                            </NavLink>
                        </div>
                    </div>

                    {/* Nav + chevrons */}
                    <div className="relative mt-2 sm:mt-0 flex items-center flex-1">
                        {canScrollLeft && (
                            <div
                                className="absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-white dark:from-black to-transparent pointer-events-none sm:hidden"/>
                        )}
                        {canScrollRight && (
                            <div
                                className="absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-white dark:from-black to-transparent pointer-events-none sm:hidden"/>
                        )}

                        {/* Left chevron (mobile only) */}
                        <div className="relative z-20 flex w-6 justify-center sm:hidden">
                            {canScrollLeft && (
                                <button
                                    onClick={() => scrollNav("left")}
                                    className="rounded-full p-1 hover:bg-black/10 dark:hover:bg-white/10"
                                >
                                    <ChevronLeftIcon className="h-5 w-5 text-black dark:text-white"/>
                                </button>
                            )}
                        </div>

                        {/* Nav links */}
                        <nav
                            ref={navRef}
                            className="flex-1 overflow-x-auto whitespace-nowrap px-1 text-xs sm:text-sm font-body scrollbar-hide sm:flex sm:flex-wrap sm:justify-end gap-3 sm:gap-6"
                        >
                            {/*{renderNavLink("home", "/")}*/}
                            {categories.length === 0 ? (
                                <span
                                    className="px-3 py-2 text-xs sm:text-sm uppercase tracking-wide text-gray-300 font-body">
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

                        {/* Right chevron (mobile only) */}
                        <div className="relative z-20 flex w-6 justify-center sm:hidden">
                            {canScrollRight && (
                                <button
                                    onClick={() => scrollNav("right")}
                                    className="rounded-full p-1 hover:bg-black/10 dark:hover:bg-white/10"
                                >
                                    <ChevronRightIcon className="h-5 w-5 text-black dark:text-white"/>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
