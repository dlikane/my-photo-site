import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const Caption = ({ caption, index }) => {
    const [displayedCaption, setDisplayedCaption] = useState("");

    // ✅ Ensure caption changes only after fade-out completes
    useEffect(() => {
        const timeout = setTimeout(() => {
            setDisplayedCaption(caption);
        }, 1000); // Delay updating the caption until halfway through fade out

        return () => clearTimeout(timeout);
    }, [caption]);

    return (
        <motion.div
            className="image-caption"
            key={index} // ✅ Ensures animation resets for each new image
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
