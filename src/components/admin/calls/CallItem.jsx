import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { iconMap } from "../../../lib/icons"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const CallItem = ({ call, onEdit, onDelete }) => {
    return (
        <div className="rounded border p-3 dark:border-white/20">
            <div className="flex justify-between text-gray-500 text-xs mb-2">
                <div>{new Date(call.date).toLocaleString()}</div>
                <div className="flex gap-2">
                    {call.contact_type && (
                        <button
                            type="button"
                            className="rounded border px-3 py-1 text-sm text-gray-600 dark:text-white"
                            title={call.contact_type}
                        >
                            <FontAwesomeIcon icon={iconMap[call.contact_type]} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onEdit}
                        className="text-blue-600 hover:underline text-xs"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="text-red-600 hover:underline text-xs"
                    >
                        Delete
                    </button>
                </div>
            </div>
            <div className="prose dark:prose-invert max-w-none text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {call.note}
                </ReactMarkdown>
            </div>
        </div>
    )
}

export default CallItem
