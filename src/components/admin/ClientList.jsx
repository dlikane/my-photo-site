import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"

const ClientList = () => {
    const [clients, setClients] = useState([])

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from("clients")
                .select("id, name, created_at")
                .order("name")

            if (!data) return

            const clientIds = data.map(c => c.id)
            const { data: calls } = await supabase
                .from("calls")
                .select("client_id, date")
                .in("client_id", clientIds)
                .order("date", { ascending: false })

            const latestCallMap = {}
            calls?.forEach(call => {
                if (!latestCallMap[call.client_id]) {
                    latestCallMap[call.client_id] = call.date
                }
            })

            const enriched = data.map(c => ({
                ...c,
                lastCall: latestCallMap[c.id] || null
            }))

            setClients(enriched)
        }

        load()
    }, [])

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            <h2 className="text-xl font-bold">Clients</h2>
            <ul className="space-y-2 text-sm">
                {clients.map((c) => (
                    <li
                        key={c.id}
                        className="flex justify-between items-center border p-3 rounded dark:border-white/20"
                    >
                        <div>
                            <Link to={`/admin/client/${c.id}`} className="text-blue-600 hover:underline">
                                {c.name}
                            </Link>
                            <div className="text-xs text-gray-500">
                                Joined {c.created_at?.slice(0, 10)}
                            </div>
                        </div>
                        {c.lastCall && (
                            <div className="text-xs text-gray-500">
                                📞 {c.lastCall}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default ClientList
