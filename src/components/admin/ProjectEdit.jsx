import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"

const ProjectEdit = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [project, setProject] = useState(null)
    const [photoFile, setPhotoFile] = useState(null)

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase.from("projects").select("*").eq("id", id).single()
            setProject(data || null)
        }
        load()
    }, [id])

    const handleChange = (field, value) => {
        setProject((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!project) return

        const ids = project.client_ids
            ?.map((s) => s.toString().trim())
            .filter(Boolean) || []

        const { error } = await supabase.from("projects").update({
            title: project.title,
            location: project.location,
            date: project.date,
            status: project.status,
            notes: project.notes,
            client_ids: ids
        }).eq("id", id)

        if (error) return

        if (photoFile) {
            const form = new FormData()
            form.append("image", photoFile)
            form.append("path", `__projects/${id}.jpg`)
            await fetch("/api/upload-to-dropbox", {
                method: "POST",
                body: form
            })
        }

        navigate(`/admin/project/${id}`)
    }

    if (!project) return <div className="p-6">Loading…</div>

    return (
        <div className="max-w-xl mx-auto p-6 space-y-6">
            <h2 className="text-xl font-bold">Edit Project</h2>

            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    value={project.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="w-full border p-2 rounded dark:bg-black"
                />

                <input
                    value={project.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    className="w-full border p-2 rounded dark:bg-black"
                />

                <input
                    type="date"
                    value={project.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                    className="w-full border p-2 rounded dark:bg-black"
                />

                <select
                    value={project.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="w-full border p-2 rounded dark:bg-black"
                >
                    <option value="done">done</option>
                    <option value="confirmed">confirmed</option>
                    <option value="planned">planned</option>
                    <option value="suggested">suggested</option>
                    <option value="idea">idea</option>
                </select>

                <textarea
                    value={project.notes || ""}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Notes (optional)"
                    className="w-full border p-2 rounded dark:bg-black"
                    rows={3}
                />

                <input
                    value={project.client_ids?.join(", ") || ""}
                    onChange={(e) =>
                        handleChange(
                            "client_ids",
                            e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean)
                        )
                    }
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
                    Save Changes
                </button>
            </form>
        </div>
    )
}

export default ProjectEdit
