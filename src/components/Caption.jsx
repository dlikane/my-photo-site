import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const Caption = ({ caption, index }) => {
    const [displayedCaption, setDisplayedCaption] = useState("");

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDisplayedCaption(caption);
        }, 1000); // Delay updating the caption until halfway through fade out

        return () => clearTimeout(timeout);
    }, [caption]);

    return (
        <motion.div
            className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 text-lg rounded-md shadow-md"
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
        >
            {displayedCaption}
        </motion.div>
    );
};

export default Caption;
