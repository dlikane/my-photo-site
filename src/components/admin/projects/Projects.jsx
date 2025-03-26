import { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabaseClient"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { iconMap } from "../../../lib/icons"
import ProjectItem from "./ProjectItem.jsx"
import { Link } from "react-router-dom"

const Projects = ({ clientId }) => {
    const [projects, setProjects] = useState([])
    const [collapsed, setCollapsed] = useState(false)

    const load = async () => {
        const { data } = await supabase
            .from("projects")
            .select("*")
            .contains("client_ids", [clientId])
            .order("date", { ascending: false })

        setProjects(data || [])
    }

    useEffect(() => {
        load()
    }, [clientId])

    return (
        <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex items-center gap-2 text-lg font-semibold"
                >
                    <FontAwesomeIcon icon={collapsed ? iconMap.chevronRight : iconMap.chevronDown} />
                    Projects
                </button>
                <Link
                    to="/admin/project-new"
                    className="rounded-full bg-black text-white dark:bg-white dark:text-black size-6 flex items-center justify-center"
                    title="Add Project"
                >
                    <FontAwesomeIcon icon={iconMap.plus} />
                </Link>
            </div>

            {!collapsed && (
                <div className="space-y-3">
                    {projects.length === 0 ? (
                        <p className="text-sm text-gray-500">No projects for this client.</p>
                    ) : (
                        projects.map((p) => <ProjectItem key={p.id} project={p} />)
                    )}
                </div>
            )}
        </div>
    )
}

export default Projects
