import { useEffect, useState } from "react";
import axios from "axios";

const CACHE_KEY = "hiddenFoldersCache";
const CACHE_DURATION = 1000 * 60 * 60 * 3; // 3 hours

const Hidden = () => {
    const [hiddenFolders, setHiddenFolders] = useState([]);
    const [filter, setFilter] = useState("");
    const [sortBy, setSortBy] = useState("year");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHidden = async () => {
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    const age = Date.now() - parsed.timestamp;
                    if (age < CACHE_DURATION) {
                        setHiddenFolders(parsed.data);
                        setLoading(false);
                        return;
                    }
                }

                const response = await axios.get("/api/categories?includeHidden=true");
                const hidden = (response.data || []).filter(name => name.startsWith("_"));

                const parsed = await Promise.all(hidden.map(async name => {
                    const parts = name.substring(1).split("_");
                    const year = parts[0];
                    const title = parts.slice(1).join(" ");

                    let image = null;
                    try {
                        const res = await axios.get(`/api/image/${name}/first`);
                        image = res.data?.url || null;
                    } catch (e) {
                        console.warn(`No image for ${name}`);
                    }

                    return { name, year, title, image };
                }));

                localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: parsed }));
                setHiddenFolders(parsed);
            } catch (e) {
                console.error("Error fetching hidden folders", e);
            } finally {
                setLoading(false);
            }
        };

        fetchHidden();
    }, []);

    const filtered = hiddenFolders.filter(h =>
        h.year.includes(filter) || h.title.toLowerCase().includes(filter.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === "year") {
            const yearCompare = b.year.localeCompare(a.year);
            return yearCompare !== 0 ? yearCompare : a.title.localeCompare(b.title);
        }
        const titleCompare = a.title.localeCompare(b.title);
        return titleCompare !== 0 ? titleCompare : b.year.localeCompare(a.year);
    });

    return (
        <div className="mx-auto max-w-6xl p-4 text-black dark:text-white">
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

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-10 text-black dark:text-white">
                    <div className="relative h-16 w-16 animate-spin rounded-full border-4 border-t-black dark:border-t-white border-transparent" />
                    <p className="text-lg font-light italic">Developing your gallery…</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                    {sorted.map(({ name, year, title, image }) => (
                        <div key={name} className="rounded-lg border bg-white shadow dark:bg-black dark:border-white">
                            {image && (
                                <img
                                    src={image}
                                    alt={title}
                                    className="aspect-video w-full rounded-t-lg object-cover"
                                />
                            )}
                            <div className="p-4">
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Hidden;
