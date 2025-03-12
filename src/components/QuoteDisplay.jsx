const QuoteDisplay = ({ quote, isPaused }) => {
    console.log("📝 Checking if quote should show:", isPaused, quote);

    return isPaused && quote ? (
        <div className="quote-container">
            <p className="quote-text">"{quote.text}"</p>
            <p className="quote-author">— {quote.author}</p>
        </div>
    ) : null;
};

export default QuoteDisplay;
