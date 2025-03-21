import { useEffect, useState } from "react";
import axios from "axios";

const Hidden = () => {
    const [hiddenFolders, setHiddenFolders] = useState([]);
    const [filter, setFilter] = useState("");
    const [sortBy, setSortBy] = useState("year");

    useEffect(() => {
        const fetchHidden = async () => {
            try {
                const response = await axios.get("/api/categories?includeHidden=true");
                const hidden = (response.data || []).filter(name => name.startsWith("_"));

                const parsed = hidden.map(name => {
                    const parts = name.substring(1).split("_");
                    const year = parts[0];
                    const title = parts.slice(1).join(" ");
                    return { name, year, title };
                });

                setHiddenFolders(parsed);
            } catch (e) {
                console.error("Error fetching hidden folders", e);
            }
        };

        fetchHidden();
    }, []);

    const filtered = hiddenFolders.filter(h =>
        h.year.includes(filter) || h.title.toLowerCase().includes(filter.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === "year") return b.year.localeCompare(a.year);
        return a.title.localeCompare(b.title);
    });

    return (
        <div className="mx-auto max-w-4xl p-4 text-black dark:text-white">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filter by year or name"
                    className="w-full rounded-md border p-2 dark:bg-black dark:border-white"
                />
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-md border p-2 dark:bg-black dark:border-white"
                >
                    <option value="year">Sort by Year</option>
                    <option value="title">Sort by Name</option>
                </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {sorted.map(({ name, year, title }) => (
                    <div key={name} className="rounded-lg border bg-white p-4 shadow dark:bg-black dark:border-white">
                        <h3 className="text-lg font-semibold">{year}</h3>
                        <p className="italic text-sm text-gray-500 dark:text-gray-400">{title}</p>
                        <div className="mt-2 flex gap-2">
                            <a
                                href={`/category/${name}/small`}
                                className="rounded bg-gray-200 px-3 py-1 text-sm hover:underline dark:bg-gray-800"
                            >
                                Small
                            </a>
                            <a
                                href={`/category/${name}/large`}
                                className="rounded bg-gray-200 px-3 py-1 text-sm hover:underline dark:bg-gray-800"
                            >
                                Large
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Hidden;
