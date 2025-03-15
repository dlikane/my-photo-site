import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import axios from "axios";

const About = () => {
    const [aboutContent, setAboutContent] = useState("");

    useEffect(() => {
        const fetchAbout = async () => {
            try {
                console.log("📡 Fetching about.md from Dropbox...");
                const response = await axios.get("/api/about");
                if (response.data?.content) {
                    setAboutContent(response.data.content);
                    return;
                }
                throw new Error("Empty content from Dropbox"); // ✅ Force fallback
            } catch (error) {
                console.warn("⚠️ Failed to load about.md from Dropbox. Fetching local version...");
                fetch("/about.md") // ✅ Ensure proper fetch from public folder
                    .then((res) => {
                        if (!res.ok) throw new Error("Failed to load local about.md");
                        return res.text();
                    })
                    .then((text) => setAboutContent(text))
                    .catch((err) => console.error("❌ Error loading local about.md:", err));
            }
        };

        fetchAbout();
    }, []);

    return (
        <div className="about-container">
            {aboutContent ? (
                <ReactMarkdown>{aboutContent}</ReactMarkdown>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default About;
