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
        <div
            className="prose dark:prose-invert hover:scrollbar-thin hover:scrollbar-track-transparent hover:scrollbar-thumb-gray-400 mx-auto w-11/12 max-w-3xl overflow-y-auto rounded-lg bg-white p-6 text-lg text-black shadow-md backdrop-blur-md scrollbar-hide dark:bg-black dark:text-white dark:shadow-lg dark:backdrop-blur-md">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {aboutContent}
            </ReactMarkdown>
            <a
                href="/hidden"
                className="fixed bottom-4 right-4 z-40 h-12 w-12 rounded-full bg-red-500/40"
            >
                <span className="sr-only">Hidden</span>
            </a>
        </div>
    );
};

export default About;
