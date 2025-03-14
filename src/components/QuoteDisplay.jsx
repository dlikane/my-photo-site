import { motion } from "framer-motion";

const QuoteDisplay = ({ quote }) => {
    if (!quote || !quote.text) return null; // ✅ Prevents crash when quote is missing

    return (
        <motion.div
            className="quote-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 2, ease: "easeInOut" } }}
        >
            <p className="quote-text">"{quote.text}"</p>
            <p className="quote-author">— {quote.author}</p>
        </motion.div>
    );
};

export default QuoteDisplay;
