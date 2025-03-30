import { useState, useEffect } from "react";
import { getImageUrlByPath } from "../lib/catalog.js";

const CachedImage = ({ img, className }) => {
    const [url, setUrl] = useState(null);

    useEffect(() => {
        getImageUrlByPath(img.path)
            .then(setUrl)
            .catch(err => console.error("Image URL error:", err));
    }, [img.path]);

    return url ? (
        <img src={url} alt={img.caption} className={className} />
    ) : (
        <div className={className}>Loading...</div>
    );
};

export default CachedImage;
