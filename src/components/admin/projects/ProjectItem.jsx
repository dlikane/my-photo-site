import { Link } from "react-router-dom"

const ProjectItem = ({ project }) => {
    return (
        <div className="rounded border p-3 text-sm dark:border-white/20">
            <div className="flex justify-between items-center">
                <Link to={`/admin/project/${project.id}`} className="text-blue-600 hover:underline">
                    {project.title}
                </Link>
                <span className="text-xs text-gray-500">{project.date}</span>
            </div>
            <p className="text-xs text-gray-500 italic">{project.location}</p>
            {project.notes && (
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{project.notes}</p>
            )}
        </div>
    )
}

export default ProjectItem
