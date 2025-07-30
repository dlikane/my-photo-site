import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getQuote } from "../lib/catalog.js";

const Quote = () => {
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchQuote = async () => {
        setLoading(true);
        try {
            const q = await getQuote();
            setQuote(q);
        } catch (err) {
            console.warn("Failed to load quote:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuote();
    }, []);

    return (
        <AnimatePresence mode="wait">
            {quote && (
                <motion.div
                    key={quote.text + quote.author}
                    className="absolute bottom-5 md:bottom-16 right-5 max-w-2xl rounded-lg bg-white/80 p-4 pr-6 text-right text-black shadow-md transition-all hover:scale-[1.01] hover:shadow-xl dark:bg-black/60 dark:text-white dark:shadow-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ opacity: { duration: 0.8, ease: "easeInOut" } }}
                >
                    {/* Next Button at top-left */}
                    <div className="absolute left-2 top-2">
                        <img
                            src="/next.svg"
                            alt="Next"
                            onClick={fetchQuote}
                            className={`size-6 cursor-pointer transition-transform hover:scale-110 ${
                                loading ? "opacity-50" : ""
                            }`}
                        />
                    </div>

                    <motion.p
                        className="text-lg italic"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
                    >
                        “{quote.text}”
                    </motion.p>

                    <motion.p
                        className="mt-2 text-sm text-gray-600 dark:text-gray-300"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeInOut", delay: 0.4 }}
                    >
                        — {quote.author}
                    </motion.p>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Quote;
