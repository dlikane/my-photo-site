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
                throw new Error("Empty content from Dropbox");
            } catch (error) {
                console.warn("⚠️ Failed to load about.md from Dropbox. Fetching local version...");
                fetch("/about.md")
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
        <div
            className="w-11/12 max-w-3xl mx-auto p-6 bg-white dark:bg-black text-black dark:text-white text-lg rounded-lg shadow-md dark:shadow-lg backdrop-blur-md dark:backdrop-blur-md overflow-y-auto scrollbar-hide hover:scrollbar-thin hover:scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
            <div className="space-y-4">
                <ReactMarkdown>{aboutContent}</ReactMarkdown>
            </div>
        </div>
    );
};

export default About;
