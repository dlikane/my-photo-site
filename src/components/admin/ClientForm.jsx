import { useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { v4 as uuidv4 } from "uuid"

const ClientForm = () => {
    const [form, setForm] = useState({
        name: "",
        facebook: "",
        instagram: "",
        whatsapp: "",
        telegram: "",
        mobile: "",
        notes: "",
        photos: []
    })

    const [uploading, setUploading] = useState(false)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files)
        setUploading(true)

        const uploaded = await Promise.all(
            files.map(async (file) => {
                const filename = `${uuidv4()}_${file.name}`
                const path = `public/${filename}`

                const { error: uploadError } = await supabase.storage
                    .from("client-photos")
                    .upload(path, file)

                if (uploadError) {
                    console.error("Upload error", uploadError)
                    return null
                }

                const { data: urlData } = supabase.storage
                    .from("client-photos")
                    .getPublicUrl(path)

                return urlData.publicUrl
            })
        )

        setForm((prev) => ({
            ...prev,
            photos: [...prev.photos, ...uploaded.filter(Boolean)]
        }))

        setUploading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const { error } = await supabase.from("clients").insert([form])
        if (error) {
            alert("Error saving client")
            console.error(error)
        } else {
            alert("Client saved!")
            setForm({
                name: "",
                facebook: "",
                instagram: "",
                whatsapp: "",
                telegram: "",
                mobile: "",
                notes: "",
                photos: []
            })
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 max-w-xl mx-auto">
            <input type="text" name="name" placeholder="Client name" onChange={handleChange} value={form.name} className="w-full border p-2" required />
            <input type="text" name="facebook" placeholder="Facebook" onChange={handleChange} value={form.facebook} className="w-full border p-2" />
            <input type="text" name="instagram" placeholder="Instagram" onChange={handleChange} value={form.instagram} className="w-full border p-2" />
            <input type="text" name="whatsapp" placeholder="WhatsApp" onChange={handleChange} value={form.whatsapp} className="w-full border p-2" />
            <input type="text" name="telegram" placeholder="Telegram" onChange={handleChange} value={form.telegram} className="w-full border p-2" />
            <input type="text" name="mobile" placeholder="Mobile" onChange={handleChange} value={form.mobile} className="w-full border p-2" />
            <textarea name="notes" placeholder="Notes" onChange={handleChange} value={form.notes} className="w-full border p-2" />

            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="w-full border p-2" capture="environment" />
            {uploading && <p className="text-sm text-gray-500">Uploading...</p>}

            <div className="flex gap-2 overflow-x-auto">
                {form.photos.map((url, i) => (
                    <img key={i} src={url} alt="preview" className="h-20 rounded" />
                ))}
            </div>

            <button type="submit" className="rounded bg-black px-4 py-2 text-white">Save Client</button>
        </form>
    )
}

export default ClientForm
