import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import axios from "axios"
import { useNavigate } from "react-router-dom"

const About = () => {
    const [aboutContent, setAboutContent] = useState("")
    const [ready, setReady] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchAbout = async () => {
            try {
                const response = await axios.get("/api/about")
                if (response.data?.content) {
                    setAboutContent(response.data.content)
                } else {
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

            <div
                onClick={() => navigate("/hidden")}
                className={`absolute bottom-4 right-4 h-4 w-4 cursor-pointer rounded-full bg-red-600 shadow-md transition-opacity ${
                    ready ? "opacity-20 hover:opacity-100" : "opacity-0 pointer-events-none"
                }`}
                title="hidden"
            />
        </div>
    )
}

export default About
