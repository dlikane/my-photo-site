import { useState, useEffect } from "react";
import { getImageUrlByPath } from "../lib/catalog.js";

const CachedImage = ({ img, className, onLoad }) => {
    const [url, setUrl] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setLoaded(false);
        getImageUrlByPath(img.path)
            .then(setUrl)
            .catch(err => console.error("Image URL error:", err));
    }, [img.path]);

    return (
        <img
            src={url ?? undefined}
            alt={img.caption}
            onLoad={() => {
                setLoaded(true);
                onLoad?.();
            }}
            className={`${className} transition-opacity duration-1000 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
    );
};

export default CachedImage;
