// tools/hash-code.js
import { pbkdf2Sync, randomBytes } from "crypto";
import { createHash } from "crypto";

const code = process.argv[2];
if (!code) {
    console.error("❌ Usage: node tools/hash-code.js <code>");
    process.exit(1);
}

// Step 1: hash with SHA256 (same as frontend)
const sha256 = createHash("sha256").update(code).digest("hex");

const salt = randomBytes(16).toString("hex");
const iter = 10000;
const hash = pbkdf2Sync(sha256, salt, iter, 64, "sha512").toString("base64");

console.log(`$pbkdf2-sha512$${iter}$${salt}$${hash}`);
