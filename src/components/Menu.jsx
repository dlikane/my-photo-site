import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faLockOpen } from "@fortawesome/free-solid-svg-icons"
import { useAuth } from "./auth/AuthProvider"
import { getMenuTags, getPlaylists, refreshCatalog } from "../lib/catalog.js"

const Menu = ({ theme, setTheme }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [categories, setCategories] = useState([])
    const [playlists, setPlaylists] = useState({})
    const navigate = useNavigate()
    const { isLoggedIn } = useAuth()
    const menuRef = useRef(null)

    useEffect(() => {
        const fetchData = async () => {
            setCategories(await getMenuTags())
            setPlaylists(await getPlaylists())
        }

        fetchData()
    }, [])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen])

    const handleNavigate = (path) => {
        setIsOpen(false)
        navigate(path)
    }

    return (
        <div className="absolute left-5 top-5 z-50" ref={menuRef}>
            <img
                src="/menu.svg"
                className="size-8 cursor-pointer transition-transform hover:scale-110"
                alt="Menu"
                onClick={() => setIsOpen(!isOpen)}
            />
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="absolute left-0 top-12 w-52 rounded-lg bg-white/80 p-4 text-black shadow-lg backdrop-blur-sm dark:bg-black/70 dark:text-white"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ul className="space-y-2 text-sm">
                            <li onClick={() => handleNavigate("/")} className="cursor-pointer hover:text-gray-400">welcome</li>
                            {categories.map((category) => (
                                <li key={category} onClick={() => handleNavigate(`/category/${category}`)} className="cursor-pointer hover:text-gray-400">
                                    {category}
                                </li>
                            ))}
                            {Object.keys(playlists).length > 0 ? (
                                Object.keys(playlists).map((name) => (
                                    <li key={name} onClick={() => handleNavigate(`/videos/${name}`)} className="cursor-pointer hover:text-gray-400">
                                        {name}
                                    </li>
                                ))
                            ) : (
                                <li className="text-gray-500">Loading…</li>
                            )}
                            <li onClick={() => window.open("https://instagram.com/dlikane", "_blank")} className="cursor-pointer hover:text-gray-400">
                                contact
                            </li>
                            <li onClick={() => handleNavigate("/about")} className="cursor-pointer hover:text-gray-400">about</li>

                            {isLoggedIn && (
                                <>
                                    <li
                                        onClick={() => handleNavigate("/admin")}
                                        className="cursor-pointer hover:text-gray-400"
                                    >
                                        <FontAwesomeIcon icon={faLockOpen} className="mr-1" />
                                        dashboard
                                    </li>
                                    <li
                                        onClick={() => refreshCatalog()}
                                        className="cursor-pointer hover:text-gray-400"
                                    >
                                        🔁 refresh catalog
                                    </li>
                                </>
                            )}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Menu
