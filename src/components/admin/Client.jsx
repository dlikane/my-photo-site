import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"
import ContactLinks from "./ContactLinks"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { iconMap } from "../../lib/icons.js"
import Calls from "./Calls"

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

            setClient(data)
        }

        load()
    }, [id])

    const getImageUrl = (path) =>
        path ? `/api/dropbox-url?path=${encodeURIComponent(path)}` : "/placeholder.svg"

    if (!client) return null

    return (
        <div className="max-w-xl mx-auto p-6 space-y-4">
            <div className="flex items-center gap-4">
                <img
                    src={getImageUrl(client.photo_path)}
                    alt={client.name}
                    className="h-20 w-20 rounded-full object-cover"
                    onError={(e) => (e.target.src = "/placeholder.svg")}
                />
                <div>
                    <h2 className="text-2xl font-bold">
                        <FontAwesomeIcon icon={iconMap.name} className="mr-2" />
                        {client.full_name || client.name}
                    </h2>
                    {client.full_name && client.full_name !== client.name && (
                        <p className="text-sm text-gray-500 italic">aka {client.name}</p>
                    )}
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
                Edit Contact
            </Link>

            <Calls clientId={id} />

            <Link
                to="/admin/client-list"
                className="inline-block text-sm text-blue-600 hover:underline"
            >
                ← Back to list
            </Link>
        </div>
    )
}

export default Client
