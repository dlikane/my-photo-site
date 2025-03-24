import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

const emptyProject = {
    title: "",
    date: "",
    location: "",
    status: "planned",
    notes: "",
};

const ProjectForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [project, setProject] = useState(emptyProject);
    const [status, setStatus] = useState("");

    useEffect(() => {
        if (isEdit) {
            supabase.from("projects").select("*").eq("id", id).single().then(({ data }) => {
                if (data) setProject(data);
            });
        }
    }, [id, isEdit]);

    const handleSave = async () => {
        const query = isEdit
            ? supabase.from("projects").update(project).eq("id", id)
            : supabase.from("projects").insert([project]).select("id").single();

        const { data, error } = await query;

        if (error) {
            setStatus("❌ " + error.message);
        } else {
            navigate(`/admin/project/${isEdit ? id : data.id}`);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6 space-y-4">
            <h2 className="text-xl font-bold">{isEdit ? "Edit Project" : "New Project"}</h2>

            <input
                type="text"
                placeholder="Title"
                value={project.title}
                onChange={(e) => setProject({ ...project, title: e.target.value })}
                className="w-full rounded border px-4 py-2 dark:bg-black dark:text-white"
            />

            <input
                type="date"
                value={project.date || ""}
                onChange={(e) => setProject({ ...project, date: e.target.value })}
                className="w-full rounded border px-4 py-2 dark:bg-black dark:text-white"
            />

            <input
                type="text"
                placeholder="Location"
                value={project.location}
                onChange={(e) => setProject({ ...project, location: e.target.value })}
                className="w-full rounded border px-4 py-2 dark:bg-black dark:text-white"
            />

            <select
                value={project.status}
                onChange={(e) => setProject({ ...project, status: e.target.value })}
                className="w-full rounded border px-4 py-2 dark:bg-black dark:text-white"
            >
                <option value="idea">Idea</option>
                <option value="suggested">Suggested</option>
                <option value="planned">Planned</option>
                <option value="confirmed">Confirmed</option>
                <option value="done">Done</option>
            </select>

            <textarea
                placeholder="Notes"
                value={project.notes}
                onChange={(e) => setProject({ ...project, notes: e.target.value })}
                className="w-full rounded border px-4 py-2 dark:bg-black dark:text-white"
            />

            <button
                onClick={handleSave}
                className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
            >
                {isEdit ? "Save" : "Create"}
            </button>

            {status && <p className="text-sm">{status}</p>}
        </div>
    );
};

export default ProjectForm;
