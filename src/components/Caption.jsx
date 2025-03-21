/* eslint-disable no-unused-vars */
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
            className="absolute left-1/2 top-5 -translate-x-1/2 rounded-md bg-black/70 px-4 py-2 text-lg text-white shadow-md"
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
