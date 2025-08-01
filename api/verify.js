// api/verify.js
import { getAccessData } from "./services/catalogLoader.js";
import { pbkdf2Sync } from "crypto";

function verifyCode(stored, providedHash) {
    try {
        const parts = stored.split("$");
        if (parts.length !== 5 || parts[1] !== "pbkdf2-sha512") {
            console.log("⚠️ Invalid stored hash format");
            return false;
        }

        const iter = parseInt(parts[2], 10);
        const salt = parts[3];
        const expectedHash = parts[4];

        console.log("🔐 Verifying with:");
        console.log("  ➤ providedHash (from frontend SHA256):", providedHash);
        console.log("  ➤ salt:", salt);
        console.log("  ➤ iterations:", iter);
        console.log("  ➤ expectedHash:", expectedHash);

        const derivedHash = pbkdf2Sync(providedHash, salt, iter, 64, "sha512").toString("base64");

        console.log("  ➤ derivedHash:", derivedHash);

        return derivedHash === expectedHash;
    } catch (err) {
        console.error("❌ Failed to verify code:", err);
        return false;
    }
}

export default async function handler(req, res) {
    try {
        const { user, hash, categoryAccess } = req.body;

        console.log("📥 Received in /api/verify:", req.body);

        if (!user || !hash || !Array.isArray(categoryAccess)) {
            console.warn("⚠️ Missing required fields");
            return res.status(400).json({ error: "Missing user, hash, or categoryAccess" });
        }

        const accessData = await getAccessData();
        const userEntry = accessData?.users?.[user];

        if (!userEntry) {
            console.warn(`❌ No such user: ${user}`);
            return res.status(403).json({ error: "Access denied (no such user)" });
        }

        console.log("🔍 Found user entry:", userEntry);

        const isCodeValid = verifyCode(userEntry.code, hash);
        if (!isCodeValid) {
            console.warn("❌ Invalid code (failed hash match)");
            return res.status(403).json({ error: "Access denied (invalid code)" });
        }

        const userLevels = userEntry.access || [];
        console.log("✅ Code valid. Checking access levels:");
        console.log("  ➤ userLevels:", userLevels);
        console.log("  ➤ categoryAccess required:", categoryAccess);

        const hasMatchingAccess = categoryAccess.some((level) => userLevels.includes(level));
        console.log("  ➤ hasMatchingAccess:", hasMatchingAccess);

        if (!hasMatchingAccess) {
            console.warn("❌ User does not have required access level");
            return res.status(403).json({ error: "Access denied (insufficient access level)" });
        }

        console.log("✅ Access granted");
        res.status(200).json({ ok: true });
    } catch (err) {
        console.error("❌ verify.js error:", err);
        res.status(500).json({ error: "Internal error" });
    }
}
