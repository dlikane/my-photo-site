import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

const CallForm = () => {
    const [clients, setClients] = useState([])
    const [clientId, setClientId] = useState("")
    const [date, setDate] = useState("")
    const [note, setNote] = useState("")
    const [calls, setCalls] = useState([])

    useEffect(() => {
        const loadClients = async () => {
            const { data } = await supabase.from("clients").select("id, name").order("name")
            setClients(data || [])
        }
        loadClients()
    }, [])

    useEffect(() => {
        const loadCalls = async () => {
            if (!clientId) return
            const { data } = await supabase
                .from("calls")
                .select("id, date, note")
                .eq("client_id", clientId)
                .order("date", { ascending: false })
            setCalls(data || [])
        }
        loadCalls()
    }, [clientId])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!clientId || !date || !note.trim()) return

        const { error } = await supabase.from("calls").insert([{ client_id: clientId, date, note }])
        if (!error) {
            setNote("")
            setDate("")
            const { data: updated } = await supabase
                .from("calls")
                .select("id, date, note")
                .eq("client_id", clientId)
                .order("date", { ascending: false })
            setCalls(updated || [])
        }
    }

    return (
        <div className="max-w-xl mx-auto p-6 space-y-6">
            <h2 className="text-xl font-bold">Call History</h2>

            <form onSubmit={handleSubmit} className="space-y-3">
                <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full border p-2 rounded dark:bg-black"
                    required
                >
                    <option value="">Select client…</option>
                    {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>

                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border p-2 rounded dark:bg-black"
                    required
                />

                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Call notes"
                    className="w-full border p-2 rounded dark:bg-black"
                    rows={3}
                    required
                />

                <button type="submit" className="w-full bg-black text-white py-2 rounded">
                    Add Call
                </button>
            </form>

            {calls.length > 0 && (
                <div>
                    <h3 className="font-semibold mt-6 mb-2">Previous Calls</h3>
                    <ul className="space-y-2 text-sm">
                        {calls.map((call) => (
                            <li key={call.id} className="rounded border p-2 dark:border-white/20">
                                <div className="text-gray-500">{call.date}</div>
                                <div>{call.note}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

export default CallForm
