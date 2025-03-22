import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"

const RequireAuth = ({ children }) => {
    const [checking, setChecking] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const check = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) navigate("/admin/login")
            setChecking(false)
        }
        check()
    }, [navigate])

    if (checking) return <p className="p-4">Checking login…</p>
    return children
}

export default RequireAuth
