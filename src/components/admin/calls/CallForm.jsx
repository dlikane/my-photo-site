import { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabaseClient"
import {contactTypeMap, iconMap} from "../../../lib/icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

const contactTypes = Object.keys(contactTypeMap)

const CallForm = ({ clientId, call = {}, onSave, onCancel }) => {
    const [date, setDate] = useState("")
    const [note, setNote] = useState("")
    const [contactType, setContactType] = useState("")

    useEffect(() => {
        setDate(call.date?.slice(0, 16) || new Date().toISOString().slice(0, 16))
        setNote(call.note || "")
        setContactType(call.contact_type || "instagram")
    }, [call])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!date || !note.trim()) return

        if (call.id) {
            await supabase.from("calls").update({ date, note, contact_type: contactType }).eq("id", call.id)
        } else {
            await supabase.from("calls").insert([{ client_id: clientId, date, note, contact_type: contactType }])
        }

        onSave()
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-2 border rounded p-3 dark:border-white/20">
            <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border p-2 rounded dark:bg-black"
                required
            />
            <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Call notes (markdown supported)"
                className="w-full border p-2 rounded dark:bg-black"
                rows={3}
                required
            />
            <div className="flex flex-wrap gap-2">
                {contactTypes.map((type) => (
                    <button
                        key={type}
                        type="button"
                        className={`rounded border px-3 py-1 text-sm ${
                            contactType === type
                                ? "bg-black text-white dark:bg-white dark:text-black"
                                : "text-gray-600 dark:text-white"
                        }`}
                        title={type}
                        onClick={() => setContactType(type)}
                    >
                        <FontAwesomeIcon icon={iconMap[type]} />
                    </button>
                ))}
            </div>
            <div className="flex gap-3 pt-2">
                <button
                    type="submit"
                    className="bg-black text-white px-4 py-2 rounded dark:bg-white dark:text-black"
                >
                    Save
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-sm text-gray-500 hover:underline"
                >
                    Cancel
                </button>
            </div>
        </form>
    )
}

export default CallForm
