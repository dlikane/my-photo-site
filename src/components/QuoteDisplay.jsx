import { motion, AnimatePresence } from "framer-motion";

const QuoteDisplay = ({ quote }) => {
    if (!quote) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="quote-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 2, ease: "easeInOut", delay: 1 } }} // ✅ Delayed fade-in
            >
                {/* ✅ Next Button Appears with Quote */}
                <motion.div
                    className="next-button-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                >
                    <span className="next-tooltip">Click anywhere for more...</span>
                    <img src="/next.svg" alt="Next" className="next-icon" />
                </motion.div>

                {/* ✅ Animated Quote Text */}
                <motion.p
                    className="quote-text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                >
                    "{quote.text}"
                </motion.p>

                {/* ✅ Animated Author Name */}
                <motion.p
                    className="quote-author"
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
