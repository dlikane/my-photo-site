import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"

const ProjectForm = () => {
    const [title, setTitle] = useState("")
    const [location, setLocation] = useState("")
    const [date, setDate] = useState("")
    const [status, setStatus] = useState("planned")
    const [notes, setNotes] = useState("")
    const [clientIds, setClientIds] = useState("")
    const [photoFile, setPhotoFile] = useState(null)

    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!title || !location || !date) return

        const ids = clientIds
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)

        const { data, error } = await supabase.from("projects").insert([
            {
                title,
                location,
                date,
                status,
                notes,
                client_ids: ids
            }
        ]).select().single()

        if (error || !data) return

        if (photoFile) {
            const form = new FormData()
            form.append("image", photoFile)
            form.append("path", `__projects/${data.id}.jpg`)
            await fetch("/api/upload-to-dropbox", {
                method: "POST",
                body: form
            })
        }

        navigate(`/admin/project/${data.id}`)
    }

    return (
        <div className="max-w-xl mx-auto p-6 space-y-6">
            <h2 className="text-xl font-bold">New Project</h2>

            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Project title"
                    className="w-full border p-2 rounded dark:bg-black"
                    required
                />

                <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location"
                    className="w-full border p-2 rounded dark:bg-black"
                    required
                />

                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border p-2 rounded dark:bg-black"
                    required
                />

                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border p-2 rounded dark:bg-black"
                >
                    <option value="done">done</option>
                    <option value="confirmed">confirmed</option>
                    <option value="planned">planned</option>
                    <option value="suggested">suggested</option>
                    <option value="idea">idea</option>
                </select>

                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes (optional)"
                    className="w-full border p-2 rounded dark:bg-black"
                    rows={3}
                />

                <input
                    value={clientIds}
                    onChange={(e) => setClientIds(e.target.value)}
                    placeholder="Client IDs (comma separated)"
                    className="w-full border p-2 rounded dark:bg-black"
                />

                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files[0])}
                    className="w-full border p-2 rounded dark:bg-black"
                />

                <button type="submit" className="w-full bg-black text-white py-2 rounded">
                    Save Project
                </button>
            </form>
        </div>
    )
}

export default ProjectForm
