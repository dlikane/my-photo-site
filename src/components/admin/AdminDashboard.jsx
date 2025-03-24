import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"

const AdminDashboard = () => {
    const [clients, setClients] = useState([])
    const [projects, setProjects] = useState([])

    useEffect(() => {
        const load = async () => {
            const [{ data: c }, { data: p }] = await Promise.all([
                supabase.from("clients").select("id, name, created_at").order("created_at", { ascending: false }).limit(5),
                supabase.from("projects").select("id, title, date").order("date", { ascending: false }).limit(5)
            ])
            setClients(c || [])
            setProjects(p || [])
        }

        load()
    }, [])

    return (
        <div className="px-6 py-10 max-w-5xl mx-auto space-y-10">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Admin Dashboard
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-black dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-3">Quick Links</h2>
                    <ul className="text-sm space-y-2">
                        <li><Link to="/admin/client-list" className="text-blue-600 hover:underline">All Clients</Link></li>
                        <li><Link to="/admin/project-list" className="text-blue-600 hover:underline">All Projects</Link></li>
                        <li><Link to="/admin/search" className="text-blue-600 hover:underline">Search</Link></li>
                        <li><Link to="/admin/client-new" className="text-blue-600 hover:underline">+ New Client</Link></li>
                        <li><Link to="/admin/project-new" className="text-blue-600 hover:underline">+ New Project</Link></li>
                    </ul>
                </div>

                <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-black dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-3">Recent Clients</h2>
                    {clients.length === 0 ? (
                        <p className="text-sm text-gray-500">No clients yet</p>
                    ) : (
                        <ul className="text-sm space-y-2">
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

                <div className="md:col-span-2 rounded-xl border bg-white p-6 shadow-sm dark:bg-black dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-3">Recent Projects</h2>
                    {projects.length === 0 ? (
                        <p className="text-sm text-gray-500">No projects yet</p>
                    ) : (
                        <ul className="text-sm space-y-2">
                            {projects.map((p) => (
                                <li key={p.id}>
                                    <Link to={`/admin/project/${p.id}`} className="text-blue-600 hover:underline">
                                        {p.title}
                                    </Link> — {p.date}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
