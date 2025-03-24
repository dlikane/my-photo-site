import Menu from "./Menu"
import { useAuth } from "./AuthProvider"
import { supabase } from "../lib/supabaseClient"
import { useNavigate } from "react-router-dom"

const Header = ({ theme, setTheme }) => {
    const { user } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate("/admin/login", { replace: true })
    }

    return (
        <header className="relative flex flex-col items-center bg-white py-0 sm:py-6 text-black dark:bg-black dark:text-white">
            <Menu theme={theme} setTheme={setTheme} />
            <div className="text-center">
                <h1 className="overflow-hidden text-ellipsis font-title text-[35.2px] font-light lowercase tracking-[1px] sm:text-[28.8px] sm:tracking-[20px]">
                    Dmitry&nbsp;&middot;&nbsp;Likane
                </h1>
                <p className="mt-1 text-[19.2px] font-light">with</p>
            </div>

            {user ? (
                <button
                    onClick={handleLogout}
                    className="absolute right-4 top-4 text-xs rounded px-3 py-1 border dark:border-white dark:text-white"
                >
                    Logout
                </button>
            ) : (
                <button
                    onClick={() => navigate("/admin/login")}
                    className="absolute right-4 top-4 text-xs rounded px-3 py-1 border dark:border-white dark:text-white"
                >
                    Admin
                </button>
            )}
        </header>
    )
}

export default Header
