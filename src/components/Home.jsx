import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getAccessByCategory,
    getCategories,
    getImagesByCategory,
    getImageUrlByPath,
} from "../lib/catalog.js";
import { hasAccess } from "../lib/access.js";

import Quote from "./Quote.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";
import CategoryCard from "./CategoryCard.jsx";

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
                        const requiredAccess = await getAccessByCategory(category);
                        const locked = requiredAccess && !hasAccess(category);
                        return { category, url, locked };
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

    const handleCardClick = (category) => {
        navigate(`/category/${category}`);
    };

    return (
        <div className="flex w-full flex-col items-center justify-center bg-white px-5 py-10 dark:bg-black">
            {loading && <LoadingSpinner />}

            <div className="grid w-full max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
                {previews.map(({ category, url, locked }) => (
                    <CategoryCard
                        key={category}
                        name={category}
                        image={url}
                        locked={locked}
                        onClick={() => handleCardClick(category)}
                    />
                ))}
            </div>

            <Quote />
        </div>
    );
};

export default Home;
