import { useState } from "react";
import axios from "axios";

const useFetchQuote = () => {
    const [quote, setQuote] = useState(null);

    const fetchQuote = async () => {
        try {
            const response = await axios.get("/api/quotes");
            console.log("✅ Fetched quote:", response.data);

            if (!response.data.quotes) {
                console.warn("⚠️ No quote received from API.");
                return;
            }

            const quotesList = response.data.quotes.split("\n").map(line => line.split("|"));
            const randomQuote = quotesList[Math.floor(Math.random() * quotesList.length)];
            setQuote({ author: randomQuote[0], text: randomQuote[1] });
        } catch (error) {
            console.error("❌ Error fetching quotes:", error.response?.data || error.message);
        }
    };

    return { quote, fetchQuote, setQuote }; // ✅ Now returns `setQuote`
};

export default useFetchQuote;
