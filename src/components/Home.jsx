import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories, getImagesByCategory, getImageUrlByPath } from "../lib/catalog.js";

const Home = () => {
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const cats = await getCategories();
                const list = await Promise.all(
                    cats.map(async (category) => {
                        const images = await getImagesByCategory(category);
                        if (!images.length) return null;
                        const url = await getImageUrlByPath(images[0].path);
                        return { category, url };
                    })
                );
                setPreviews(list.filter(Boolean));
            } catch (err) {
                console.error("❌ Failed to load preview images", err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    return (
        <div className="flex w-full flex-col items-center justify-center bg-white px-5 py-10 dark:bg-black">
            {loading && (
                <div className="py-10 text-center text-gray-500 dark:text-gray-300">Loading categories…</div>
            )}

            <div className="grid w-full max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
                {previews.map(({ category, url }) => (
                    <div
                        key={category}
                        onClick={() => navigate(`/category/${category}`)}
                        className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg bg-gray-100 shadow-md transition hover:scale-105 dark:bg-gray-800"
                    >
                        <img
                            src={url}
                            alt={category}
                            className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                        />
                        <div className="absolute bottom-0 w-full bg-black/60 py-2 text-center text-sm uppercase tracking-widest text-white">
                            {category}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Home;
