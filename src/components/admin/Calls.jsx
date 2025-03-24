import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const Calls = ({ clientId }) => {
    const [calls, setCalls] = useState([])
    const [date, setDate] = useState("")
    const [note, setNote] = useState("")

    useEffect(() => {
        const now = new Date().toISOString().slice(0, 16)
        setDate(now)
    }, [])

    useEffect(() => {
        if (!clientId) return

        const loadCalls = async () => {
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
        if (!date || !note.trim()) return

        const { error } = await supabase.from("calls").insert([{ client_id: clientId, date, note }])
        if (!error) {
            setNote("")
            setDate(new Date().toISOString().slice(0, 16))
            const { data: updated } = await supabase
                .from("calls")
                .select("id, date, note")
                .eq("client_id", clientId)
                .order("date", { ascending: false })
            setCalls(updated || [])
        }
    }

    return (
        <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Calls</h3>

            <form onSubmit={handleSubmit} className="space-y-2">
                <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border p-2 rounded dark:bg-black"
                    required
                />
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Call notes (markdown supported)"
                    className="w-full border p-2 rounded dark:bg-black"
                    rows={3}
                    required
                />
                <button type="submit" className="bg-black text-white px-4 py-2 rounded dark:bg-white dark:text-black">
                    Add Call
                </button>
            </form>

            {calls.length > 0 && (
                <ul className="space-y-4 text-sm">
                    {calls.map((call) => (
                        <li key={call.id} className="rounded border p-3 dark:border-white/20">
                            <div className="text-gray-500 mb-1">
                                {new Date(call.date).toLocaleString()}
                            </div>
                            <div className="prose dark:prose-invert max-w-none text-sm">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {call.note}
                                </ReactMarkdown>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default Calls
