import { useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../AuthProvider"

const Login = () => {
    const [email, setEmail] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const navigate = useNavigate()
    const { user } = useAuth()

    const handleLogin = async (e) => {
        e.preventDefault()
        if (!email) return

        const { error } = await supabase.auth.signInWithOtp({ email })
        if (!error) setSubmitted(true)
    }

    if (user) {
        navigate("/admin", { replace: true })
        return null
    }

    return (
        <div className="max-w-sm mx-auto p-6 space-y-4 text-sm">
            <h2 className="text-xl font-bold">Admin Login</h2>

            {submitted ? (
                <p className="text-green-600">Check your email for a login link.</p>
            ) : (
                <form onSubmit={handleLogin} className="space-y-3">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email"
                        required
                        className="w-full border p-2 rounded dark:bg-black"
                    />
                    <button type="submit" className="w-full bg-black text-white py-2 rounded">
                        Send Login Link
                    </button>
                </form>
            )}
        </div>
    )
}

export default Login
