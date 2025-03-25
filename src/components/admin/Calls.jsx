import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import CallItem from "./calls/CallItem"
import CallForm from "./calls/CallForm"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

const Calls = ({ clientId }) => {
    const [calls, setCalls] = useState([])
    const [editingId, setEditingId] = useState(null)
    const [newCallOpen, setNewCallOpen] = useState(false)

    const loadCalls = async () => {
        const { data } = await supabase
            .from("calls")
            .select("*")
            .eq("client_id", clientId)
            .order("date", { ascending: false })

        setCalls(data || [])
    }

    useEffect(() => {
        loadCalls()
    }, [clientId])

    const handleSave = async () => {
        setNewCallOpen(false)
        setEditingId(null)
        loadCalls()
    }

    const handleDelete = async (id) => {
        await supabase.from("calls").delete().eq("id", id)
        loadCalls()
    }

    return (
        <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Calls</h3>
                {!newCallOpen && (
                    <button
                        type="button"
                        onClick={() => setNewCallOpen(true)}
                        className="rounded-full bg-black text-white dark:bg-white dark:text-black size-6 flex items-center justify-center"
                        title="Add Call"
                    >
                        <FontAwesomeIcon icon={["fas", "plus"]} />
                    </button>
                )}
            </div>

            {newCallOpen && (
                <CallForm
                    clientId={clientId}
                    call={{}} // ensure stable reference
                    onSave={handleSave}
                    onCancel={() => setNewCallOpen(false)}
                />
            )}

            {calls.map((call) =>
                editingId === call.id ? (
                    <CallForm
                        key={call.id}
                        clientId={clientId}
                        call={call}
                        onSave={handleSave}
                        onCancel={() => setEditingId(null)}
                    />
                ) : (
                    <CallItem
                        key={call.id}
                        call={call}
                        onEdit={() => setEditingId(call.id)}
                        onDelete={() => handleDelete(call.id)}
                    />
                )
            )}
        </div>
    )
}

export default Calls
