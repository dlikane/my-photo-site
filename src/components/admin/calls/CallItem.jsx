import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { iconMap } from "../../../lib/icons"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const CallItem = ({ call, onEdit, onDelete }) => {
    const [confirming, setConfirming] = useState(false)

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
                    {confirming ? (
                        <>
                            <button
                                onClick={() => {
                                    onDelete()
                                    setConfirming(false)
                                }}
                                className="text-red-600 hover:underline"
                            >
                                confirm
                            </button>
                            <button
                                onClick={() => setConfirming(false)}
                                className="text-gray-500 hover:underline"
                            >
                                cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={onEdit}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                            >
                                <FontAwesomeIcon icon={iconMap.pen} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirming(true)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                            >
                                <FontAwesomeIcon icon={iconMap.trash} />
                            </button>
                        </>
                    )}
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
