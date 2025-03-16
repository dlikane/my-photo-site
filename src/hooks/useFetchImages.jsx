import { useState, useEffect } from "react";
import axios from "axios";

const useFetchImages = () => {
    const [images, setImages] = useState([]);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const response = await axios.get(`/api/images`, { params: { category: "" } });
                console.log("✅ Successfully fetched images:", response.data);

                if (!Array.isArray(response.data) || response.data.length === 0) {
                    console.warn("⚠️ No images received from API.");
                    return;
                }

                const validImages = response.data.filter(img => img.url && img.name);
                setImages(validImages.sort(() => Math.random() - 0.5));
            } catch (error) {
                console.error("❌ Error fetching images:", error.response?.data || error.message);
            }
        };

        fetchImages();
    }, []);

    return images;
};

export default useFetchImages;
