import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"

const ProjectDetails = () => {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [clients, setClients] = useState([])
  const [photoUrl, setPhotoUrl] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("projects").select("*").eq("id", id).single()
      if (!data) return

      setProject(data)

      if (data.client_ids?.length) {
        const { data: clientData } = await supabase
            .from("clients")
            .select("id, name")
            .in("id", data.client_ids)
        setClients(clientData || [])
      }

      try {
        const dropboxPath = `__projects/${id}.jpg`
        const res = await fetch(`/api/dropbox-url?path=${encodeURIComponent(dropboxPath)}`)
        const { url } = await res.json()
        setPhotoUrl(url)
      } catch {
        setPhotoUrl(null)
      }
    }

    load()
  }, [id])

  if (!project) return <div className="p-6">Loading…</div>

  return (
      <div className="max-w-xl mx-auto p-6 space-y-6">
        <h2 className="text-xl font-bold">Project: {project.title}</h2>

        {photoUrl ? (
            <img src={photoUrl} alt={project.title} className="w-full max-w-sm object-cover rounded border" />
        ) : (
            <div className="w-full max-w-sm h-40 bg-gray-200 flex items-center justify-center rounded text-gray-500 text-sm">
              No photo
            </div>
        )}

        <div className="text-sm text-gray-600 space-y-1">
          <p>📍 {project.location}</p>
          <p>📅 {project.date}</p>
          <p>
            ✅ Status:{" "}
            <span className="capitalize font-semibold text-black dark:text-white">
            {project.status}
          </span>
          </p>
          {project.notes && <p className="italic mt-2">📝 {project.notes}</p>}
        </div>

        {clients.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p className="mt-4 font-semibold">Clients:</p>
              <ul className="list-disc pl-5">
                {clients.map((c) => (
                    <li key={c.id}>
                      <Link to={`/admin/client/${c.id}`} className="text-blue-600 hover:underline">
                        {c.name}
                      </Link>
                    </li>
                ))}
              </ul>
            </div>
        )}

        <Link
            to={`/admin/project-edit/${id}`}
            className="inline-block mt-4 text-sm text-blue-600 hover:underline"
        >
          Edit project
        </Link>
      </div>
  )
}

export default ProjectDetails
