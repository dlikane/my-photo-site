import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"

const AdminSearch = () => {
    const [query, setQuery] = useState("")
    const [clients, setClients] = useState([])
    const [projects, setProjects] = useState([])
    const [clientSort, setClientSort] = useState("asc")
    const [projectSort, setProjectSort] = useState("desc")

    useEffect(() => {
        if (!query.trim()) {
            setClients([])
            setProjects([])
            return
        }

        const fetch = async () => {
            const [{ data: c }, { data: p }] = await Promise.all([
                supabase
                    .from("clients")
                    .select("id, name")
                    .ilike("name", `%${query}%`)
                    .order("name", { ascending: clientSort === "asc" }),
                supabase
                    .from("projects")
                    .select("id, title, location, date")
                    .or(`title.ilike.%${query}%,location.ilike.%${query}%`)
                    .order("date", { ascending: projectSort === "asc" })
            ])
            setClients(c || [])
            setProjects(p || [])
        }

        const delay = setTimeout(fetch, 300)
        return () => clearTimeout(delay)
    }, [query, clientSort, projectSort])

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            <h2 className="text-xl font-bold">Search</h2>
            <input
                type="text"
                placeholder="Search by name, project or location..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full border p-2 rounded dark:bg-black"
            />

            {query && (
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Clients</h3>
                            <button
                                onClick={() => setClientSort((prev) => (prev === "asc" ? "desc" : "asc"))}
                                className="text-xs text-gray-500 underline"
                            >
                                Sort: {clientSort === "asc" ? "A→Z" : "Z→A"}
                            </button>
                        </div>

                        {clients.length === 0 ? (
                            <p className="text-sm text-gray-500">No matches</p>
                        ) : (
                            <ul className="text-sm space-y-1 mt-1">
                                {clients.map((c) => (
                                    <li key={c.id}>
                                        <Link to={`/admin/client/${c.id}`} className="text-blue-600 hover:underline">
                                            {c.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div>
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Projects</h3>
                            <button
                                onClick={() => setProjectSort((prev) => (prev === "desc" ? "asc" : "desc"))}
                                className="text-xs text-gray-500 underline"
                            >
                                Sort: {projectSort === "desc" ? "Newest" : "Oldest"}
                            </button>
                        </div>

                        {projects.length === 0 ? (
                            <p className="text-sm text-gray-500">No matches</p>
                        ) : (
                            <ul className="text-sm space-y-1 mt-1">
                                {projects.map((p) => (
                                    <li key={p.id}>
                                        <Link to={`/admin/project/${p.id}`} className="text-blue-600 hover:underline">
                                            {p.title}
                                        </Link>{" "}
                                        — {p.date} ({p.location})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminSearch
