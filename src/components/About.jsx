import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import axios from "axios";

const About = () => {
    const [aboutContent, setAboutContent] = useState("");

    useEffect(() => {
        const fetchAbout = async () => {
            try {
                const response = await axios.get("/api/about");
                if (response.data?.content) {
                    setAboutContent(response.data.content);
                    return;
                }
                throw new Error("Empty content from Dropbox");
            } catch {
                const res = await fetch("/about.md");
                const text = await res.text();
                setAboutContent(text);
            }
        };

        fetchAbout();
    }, []);

    return (
        <div className="w-11/12 max-w-3xl mx-auto p-6 bg-white dark:bg-black text-black dark:text-white text-lg rounded-lg shadow-md dark:shadow-lg backdrop-blur-md dark:backdrop-blur-md overflow-y-auto scrollbar-hide hover:scrollbar-thin hover:scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {aboutContent}
            </ReactMarkdown>
        </div>
    );
};

export default About;
