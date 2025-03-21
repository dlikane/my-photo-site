import { motion, AnimatePresence } from "framer-motion";

const QuoteDisplay = ({ quote }) => {
    if (!quote) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="absolute bottom-5 right-5 w-1/3 text-right bg-white dark:bg-black/70 text-black dark:text-white p-4 rounded-lg shadow-md dark:shadow-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 2, ease: "easeInOut", delay: 1 } }}
            >
                <motion.div
                    className="flex justify-center items-center mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                >
                    <img src="/next.svg" alt="Next" className="w-6 h-6 ml-2 transition-transform hover:scale-110" />
                </motion.div>

                <motion.p
                    className="text-lg italic"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                >
                    "{quote.text}"
                </motion.p>

                <motion.p
                    className="mt-2 text-sm text-gray-600 dark:text-gray-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: "easeInOut", delay: 1 }}
                >
                    — {quote.author}
                </motion.p>
            </motion.div>
        </AnimatePresence>
    );
};

export default QuoteDisplay;
