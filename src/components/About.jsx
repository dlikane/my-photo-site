import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import { getAbout } from "../lib/catalog.js";

const About = () => {
    const [aboutContent, setAboutContent] = useState("")

    useEffect(() => {
        const fetchAbout = async () => {
            try {
                try {
                    const content = await getAbout();
                    setAboutContent(content || "");
                } catch (err) {
                    console.error("Failed to load about:", err);
                    const res = await fetch("/about.md")
                    const text = await res.text()
                    setAboutContent(text)
                }
            } catch {
                const res = await fetch("/about.md")
                const text = await res.text()
                setAboutContent(text)
            } finally {
                setTimeout(() => setReady(true), 200)
            }
        }

        fetchAbout()
    }, [])

    return (
        <div className="relative mx-auto w-11/12 max-w-3xl overflow-y-auto rounded-lg bg-white p-6 text-lg text-black shadow-md backdrop-blur-md scrollbar-hide dark:bg-black dark:text-white dark:shadow-lg dark:backdrop-blur-md">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {aboutContent}
            </ReactMarkdown>
        </div>
    )
}

export default About
