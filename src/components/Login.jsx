import { useState, useRef } from "react";

const Login = ({ category, onSubmit, onClose }) => {
    const [user, setUser] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");

    const codeInputRef = useRef(null);

    const handleSubmit = async () => {
        const ok = await onSubmit({ user, code });
        if (!ok) setError("Access denied. Try again.");
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-80 space-y-4 text-black dark:text-white">
                <h2 className="text-xl font-bold text-center">🔒 Enter Access Code</h2>
                <div className="space-y-2">
                    <input
                        type="text"
                        placeholder="User"
                        value={user}
                        onChange={(e) => setUser(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                codeInputRef.current?.focus();
                            }
                        }}
                        className="w-full rounded border px-3 py-2 dark:bg-black dark:border-white"
                    />
                    <input
                        type="password"
                        placeholder="Code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                        ref={codeInputRef}
                        className="w-full rounded border px-3 py-2 dark:bg-black dark:border-white"
                    />
                    {error && <div className="text-red-500 text-sm">{error}</div>}
                </div>
                <div className="flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded dark:bg-gray-700">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-black text-white rounded dark:bg-white dark:text-black">Submit</button>
                </div>
            </div>
        </div>
    );
};

export default Login;
