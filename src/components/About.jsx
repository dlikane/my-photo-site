import { useState, useEffect } from "react";

const About = () => {
    const [aboutContent, setAboutContent] = useState("");

    useEffect(() => {
        const fetchAbout = async () => {
            try {
                const res = await fetch("/about.html");
                const text = await res.text();
                setAboutContent(text);
            } catch (err) {
                console.error("Failed to load about:", err);
                setAboutContent("<p>Unable to load bio.</p>");
            }
        };

        fetchAbout();
    }, []);

    return (
        <div className="relative mx-auto w-11/12 max-w-3xl overflow-y-auto rounded-lg bg-white p-6 text-lg text-black shadow-md backdrop-blur-md scrollbar-hide dark:bg-black dark:text-white dark:shadow-lg dark:backdrop-blur-md font-body">
            <div className="flex flex-wrap items-start">
                <img
                    src="/me.jpg"
                    alt="Dmitry Likane"
                    className="w-40 h-40 rounded-full object-cover mr-6 mb-4 float-left"
                />
                <div
                    className="flex-1 min-w-[200px] prose prose-lg dark:prose-invert prose-headings:font-title prose-headings:text-2xl prose-headings:mt-6 prose-p:my-4 prose-p:leading-relaxed"
                    dangerouslySetInnerHTML={{__html: aboutContent}}
                />
            </div>
        </div>
    );
};

export default About;
