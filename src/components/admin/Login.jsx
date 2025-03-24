import { useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { allowedEmails } from "../../resources/adminEmails"
import { useNavigate } from "react-router-dom"

const Login = () => {
    const [email, setEmail] = useState("")
    const [status, setStatus] = useState("")
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        const trimmedEmail = email.trim().toLowerCase()

        if (!allowedEmails.includes(trimmedEmail)) {
            setStatus("❌ Access denied.")
            return
        }

        const { error } = await supabase.auth.signInWithOtp({ email: trimmedEmail })
        if (error) {
            setStatus("❌ " + error.message)
        } else {
            setStatus("✅ Check your email for a login link.")
        }
    }

    return (
        <div className="mx-auto mt-20 max-w-md rounded-lg bg-white p-6 shadow dark:bg-black dark:text-white">
            <h2 className="mb-4 text-center text-2xl font-light">Admin Login</h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value)
                        setStatus("")
                    }}
                    className="rounded border border-gray-300 px-4 py-2 dark:bg-black dark:text-white dark:border-white"
                    required
                />
                {status && (
                    <div
                        className={`text-sm ${
                            status.startsWith("✅") ? "text-green-600" : "text-red-500"
                        }`}
                    >
                        {status}
                    </div>
                )}
                <button
                    type="submit"
                    className="rounded bg-black px-4 py-2 text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                    Send Login Link
                </button>
            </form>
        </div>
    )
}

export default Login
