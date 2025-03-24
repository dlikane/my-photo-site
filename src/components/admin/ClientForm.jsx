import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"
import { v4 as uuidv4 } from "uuid"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { iconMap } from "../../lib/icons"

const emptyContacts = {
    mobile: "",
    instagram: "",
    whatsapp: "",
    telegram: "",
    messenger: "",
}

const ClientForm = () => {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()
    const [client, setClient] = useState({ name: "", contacts: emptyContacts, notes: "", photo_path: "" })
    const [file, setFile] = useState(null)

    useEffect(() => {
        if (!isEdit) return

        const load = async () => {
            const { data } = await supabase.from("clients").select("*").eq("id", id).single()
            if (data) {
                const fullContacts = { ...emptyContacts, ...(data.contacts || {}) }
                setClient({ ...data, contacts: fullContacts })
            }
        }

        load()
    }, [id, isEdit])

    const handleChange = (e) => {
        const { name, value } = e.target
        if (name in emptyContacts) {
            setClient((prev) => ({ ...prev, contacts: { ...prev.contacts, [name]: value } }))
        } else {
            setClient((prev) => ({ ...prev, [name]: value }))
        }
    }

    const handleFile = (e) => {
        if (e.target.files?.[0]) setFile(e.target.files[0])
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        let photoPath = client.photo_path

        if (file) {
            const filename = `${uuidv4()}.jpg`
            const path = `__clients/${filename}`
            console.log("📸 File selected:", file.name)
            console.log("📤 Uploading to Dropbox:", path)

            const formData = new FormData()
            formData.append("file", file)
            formData.append("path", path)

            const res = await fetch("/api/upload-to-dropbox", {
                method: "POST",
                body: formData,
            })

            const data = await res.json()
            console.log("📥 Dropbox response:", data)

            if (res.ok && data.url) photoPath = path
        }

        const payload = {
            name: client.name,
            contacts: client.contacts,
            notes: client.notes,
            photo_path: photoPath,
        }

        if (isEdit) {
            await supabase.from("clients").update(payload).eq("id", id)
        } else {
            await supabase.from("clients").insert([{ ...payload, id: uuidv4() }])
        }

        const newId = id || payload.id
        navigate(`/admin/client/${newId}`)
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4 p-6">
            <div className="flex items-center">
                <FontAwesomeIcon icon={iconMap.name} className="mr-2"/>
                <input
                    name="name"
                    placeholder="Name"
                    value={client.name}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border"
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
                {Object.entries(client.contacts).map(([key, val]) => (
                    <div className="flex items-center" key={key}>
                        <FontAwesomeIcon icon={iconMap[key] || iconMap.mobile} className="mr-2"/>
                        <input
                            name={key}
                            placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                            value={val}
                            onChange={handleChange}
                            className="w-full p-2 border"
                        />
                    </div>
                ))}
            </div>

            <div className="flex items-start">
                <FontAwesomeIcon icon={iconMap.notes} className="mr-2 pt-2"/>
                <textarea
                    name="notes"
                    placeholder="Notes"
                    value={client.notes}
                    onChange={handleChange}
                    className="w-full p-2 border"
                />
            </div>

            {client.photo_path && (
                <img
                    src={`/api/dropbox-url?path=${encodeURIComponent(client.photo_path)}`}
                    alt="Client"
                    className="h-24 w-24 rounded-full object-cover"
                    onError={(e) => (e.target.src = "/placeholder.svg")}
                />
            )}

            <input type="file" accept="image/*" onChange={handleFile}/>

            <div className="flex gap-4">
                <button type="submit" className="bg-black text-white px-4 py-2 rounded">
                    {isEdit ? "Update" : "Create"}
                </button>
                <button
                    type="button"
                    onClick={() => navigate(isEdit ? `/admin/client/${id}` : "/admin/client-list")}
                    className="text-sm text-blue-600 hover:underline"
                >
                    Cancel
                </button>
            </div>
        </form>
    )
}

export default ClientForm
