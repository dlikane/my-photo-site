global.simpleCache = global.simpleCache || { memory: null };

export default function handler(req, res) {
    const { txt } = req.query;

    if (!txt) {
        return res.status(400).json({ error: "No txt parameter provided" });
    }

    if (global.simpleCache.memory !== null) {
        console.log("Previous txt:", global.simpleCache.memory);
    } else {
        console.log("No previous txt stored.");
    }
    console.log("New txt:", txt);

    global.simpleCache.memory = txt;

    res.status(200).json({ saved: txt });
}
