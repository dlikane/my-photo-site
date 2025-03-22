import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"

const ClientEdit = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [form, setForm] = useState(null)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase.from("clients").select("*").eq("id", id).single()
            setForm(data)
        }

        load()
    }, [id])

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files)
        setUploading(true)

        const uploaded = await Promise.all(
            files.map(async (file) => {
                const formData = new FormData()
                formData.append("file", file)

                const res = await fetch("/api/upload-client-photo", {
                    method: "POST",
                    body: formData
                })

                const { url } = await res.json()
                return url || null
            })
        )

        setForm((prev) => ({
            ...prev,
            photos: [...(prev.photos || []), ...uploaded.filter(Boolean)]
        }))

        setUploading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const { error } = await supabase.from("clients").update(form).eq("id", id)
        if (error) {
            alert("Error saving client")
            console.error(error)
        } else {
            alert("Client updated")
            navigate(`/admin/client/${id}`)
        }
    }

    if (!form) return <p className="p-4">Loading…</p>

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 max-w-xl mx-auto">
            <input type="text" name="name" placeholder="Client name" onChange={handleChange} value={form.name} className="w-full border p-2" required />
            <input type="text" name="facebook" placeholder="Facebook" onChange={handleChange} value={form.facebook} className="w-full border p-2" />
            <input type="text" name="instagram" placeholder="Instagram" onChange={handleChange} value={form.instagram} className="w-full border p-2" />
            <input type="text" name="whatsapp" placeholder="WhatsApp" onChange={handleChange} value={form.whatsapp} className="w-full border p-2" />
            <input type="text" name="telegram" placeholder="Telegram" onChange={handleChange} value={form.telegram} className="w-full border p-2" />
            <input type="text" name="mobile" placeholder="Mobile" onChange={handleChange} value={form.mobile} className="w-full border p-2" />
            <textarea name="notes" placeholder="Notes" onChange={handleChange} value={form.notes} className="w-full border p-2" />

            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="w-full border p-2" />
            {uploading && <p className="text-sm text-gray-500">Uploading…</p>}

            <div className="flex gap-2 overflow-x-auto">
                {form.photos?.map((url, i) => (
                    <img key={i} src={url} alt="preview" className="h-20 rounded" />
                ))}
            </div>

            <button type="submit" className="rounded bg-black px-4 py-2 text-white">Update Client</button>
        </form>
    )
}

export default ClientEdit
