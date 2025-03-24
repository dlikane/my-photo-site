import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"
import ContactLinks from "./ContactLinks"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { iconMap } from "../../lib/icons.js"
import Calls from "./Calls.jsx";

const Client = () => {
    const { id } = useParams()
    const [client, setClient] = useState(null)

    useEffect(() => {
        const load = async () => {
            const { data, error } = await supabase
                .from("clients")
                .select("*")
                .eq("id", id)
                .single()

            if (error) {
                console.error("Error loading client:", error)
                return
            }

            console.log("Loaded client:", data)
            setClient(data)
        }

        load()
    }, [id])

    const getImageUrl = (path) => {
        const url = path ? `/api/dropbox-url?path=${encodeURIComponent(path)}` : "/placeholder.svg"
        console.log("🔗 Image URL:", url)
        return url
    }

    if (!client) return null

    return (
        <div className="max-w-xl mx-auto p-6 space-y-4">
            <div className="flex items-center gap-4">
                <img
                    src={getImageUrl(client.photo_path)}
                    alt={client.name}
                    className="h-20 w-20 rounded-full object-cover"
                    onLoad={() => console.log("✅ Image loaded")}
                    onError={(e) => {
                        console.log("❌ Image failed to load:", e.target.src)
                        e.target.src = "/placeholder.svg"
                    }}
                />
                <div>
                    <h2 className="text-2xl font-bold">
                        <FontAwesomeIcon icon={iconMap.name} className="mr-2" />
                        {client.name}
                    </h2>
                    <p className="text-sm text-gray-500">Joined {client.created_at?.slice(0, 10)}</p>
                </div>
            </div>

            {client.contacts && (
                <div>
                    <h4 className="font-semibold">Contacts</h4>
                    <ContactLinks contacts={client.contacts} />
                </div>
            )}

            {client.notes && (
                <p>
                    <FontAwesomeIcon icon={iconMap.notes} className="mr-2" />
                    {client.notes}
                </p>
            )}

            <Link
                to={`/admin/client-edit/${id}`}
                className="inline-block rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
            >
                Edit
            </Link>

            <Link
                to="/admin/client-list"
                className="ml-4 inline-block text-sm text-blue-600 hover:underline"
            >
                ← Back to list
            </Link>

            <Calls clientId={client.id} />
        </div>
    )
}

export default Client
