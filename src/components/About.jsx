import { useState, useEffect } from "react";
import { getAbout } from "../lib/catalog.js"; // ⬅️ Make sure path is correct

const About = () => {
    const [aboutContent, setAboutContent] = useState("");

    useEffect(() => {
        const loadAbout = async () => {
            try {
                const html = await getAbout();
                setAboutContent(html || "<p>No bio available.</p>");
            } catch (err) {
                console.error("❌ Failed to load about from catalog:", err);
                setAboutContent("<p>Unable to load bio.</p>");
            }
        };

        loadAbout();
    }, []);

    return (
        <div className="relative mx-auto w-11/12 max-w-3xl overflow-y-auto rounded-lg bg-white p-6 text-lg text-black shadow-md backdrop-blur-md scrollbar-hide dark:bg-black dark:text-white dark:shadow-lg dark:backdrop-blur-md font-body">
            <div className="flex flex-col sm:flex-row items-start gap-6">
                <img
                    src="/me.jpg"
                    alt="Dmitry Likane"
                    className="w-40 h-40 rounded-full object-cover self-start mx-auto sm:mx-0"
                />
                <div
                    className="flex-1 prose prose-lg dark:prose-invert prose-headings:font-title prose-headings:text-2xl prose-headings:mt-6 prose-p:my-4 prose-p:leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: aboutContent }}
                />
            </div>
        </div>
    );
};

export default About;
