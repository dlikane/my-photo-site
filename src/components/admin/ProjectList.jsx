import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"

const ProjectList = () => {
    const [projects, setProjects] = useState([])
    const [statusFilter, setStatusFilter] = useState("all")

    useEffect(() => {
        const load = async () => {
            const { data: p } = await supabase
                .from("projects")
                .select("id, title, location, date, status, client_ids")
                .order("date", { ascending: false })

            if (!p) return

            const clientIds = Array.from(
                new Set(p.flatMap(proj => proj.client_ids || []))
            )

            const { data: clients } = await supabase
                .from("clients")
                .select("id, name")
                .in("id", clientIds)

            const clientMap = {}
            clients?.forEach(c => { clientMap[c.id] = c.name })

            const enriched = p.map(proj => ({
                ...proj,
                clients: (proj.client_ids || []).map(id => clientMap[id]).filter(Boolean)
            }))

            setProjects(enriched)
        }

        load()
    }, [])

    const statusColors = {
        done: "bg-green-600",
        confirmed: "bg-blue-600",
        planned: "bg-yellow-500",
        suggested: "bg-purple-600",
        idea: "bg-gray-500"
    }

    const filtered = statusFilter === "all"
        ? projects
        : projects.filter(p => p.status === statusFilter)

    const statuses = ["all", "done", "confirmed", "planned", "suggested", "idea"]

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <h2 className="text-xl font-bold">Projects</h2>

            <div className="flex flex-wrap gap-2">
                {statuses.map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`text-xs px-3 py-1 rounded border ${
                            statusFilter === s
                                ? "bg-black text-white dark:bg-white dark:text-black"
                                : "bg-white text-black dark:bg-black dark:text-white"
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <ul className="space-y-4 text-sm">
                {filtered.map(p => (
                    <li key={p.id} className="rounded border p-4 dark:border-white/20">
                        <div className="flex justify-between items-center mb-2">
                            <Link to={`/admin/project/${p.id}`} className="text-blue-600 font-semibold hover:underline">
                                {p.title}
                            </Link>
                            <span className={`text-white text-xs px-2 py-1 rounded ${statusColors[p.status] || "bg-gray-400"}`}>
                {p.status}
              </span>
                        </div>
                        <div className="text-xs text-gray-500">
                            {p.date} · {p.location}
                        </div>
                        {p.clients?.length > 0 && (
                            <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                                Clients: {p.clients.join(", ")}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default ProjectList
