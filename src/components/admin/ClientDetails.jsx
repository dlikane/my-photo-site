import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"

const ClientDetails = () => {
    const { id } = useParams()
    const [client, setClient] = useState(null)
    const [calls, setCalls] = useState([])
    const [photoUrl, setPhotoUrl] = useState(null)

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase.from("clients").select("*").eq("id", id).single()
            setClient(data || null)

            const { data: c } = await supabase
                .from("calls")
                .select("id, date, note")
                .eq("client_id", id)
                .order("date", { ascending: false })
            setCalls(c || [])

            try {
                const dropboxPath = `__clients/${id}.jpg`
                const res = await fetch(`/api/dropbox-url?path=${encodeURIComponent(dropboxPath)}`)
                const { url } = await res.json()
                setPhotoUrl(url)
            } catch {
                setPhotoUrl(null)
            }
        }

        load()
    }, [id])

    if (!client) return <div className="p-6">Loading…</div>

    return (
        <div className="max-w-xl mx-auto p-6 space-y-6">
            <h2 className="text-xl font-bold">Client: {client.name}</h2>

            {photoUrl ? (
                <img src={photoUrl} alt={client.name} className="w-40 h-40 object-cover rounded border" />
            ) : (
                <div className="w-40 h-40 bg-gray-200 flex items-center justify-center rounded text-gray-500 text-sm">
                    No photo
                </div>
            )}

            <div className="text-sm text-gray-600 space-y-1">
                {client.mobile && <p>📱 {client.mobile}</p>}
                {client.facebook && <p>📘 FB: {client.facebook}</p>}
                {client.instagram && <p>📷 IG: {client.instagram}</p>}
                {client.telegram && <p>📨 TG: {client.telegram}</p>}
                {client.whatsapp && <p>🟢 WA: {client.whatsapp}</p>}
                {client.notes && <p className="italic mt-2">📝 {client.notes}</p>}
            </div>

            <Link
                to={`/admin/client-edit/${id}`}
                className="inline-block mt-4 text-sm text-blue-600 hover:underline"
            >
                Edit client
            </Link>

            <hr className="border-t dark:border-white/20" />

            <h3 className="font-semibold">Call history</h3>
            {calls.length === 0 ? (
                <p className="text-sm text-gray-500">No calls yet.</p>
            ) : (
                <ul className="space-y-2 text-sm">
                    {calls.map((c) => (
                        <li key={c.id} className="rounded border p-2 dark:border-white/20">
                            <div className="text-gray-500">{c.date}</div>
                            <div>{c.note}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default ClientDetails
