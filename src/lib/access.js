import { sha256 } from 'js-sha256';

const ACCESS_KEY = 'access-rights';

export function hasAccess(category) {
    const data = JSON.parse(sessionStorage.getItem(ACCESS_KEY) || '{}');
    return data[category] === true;
}

export function grantAccess(category) {
    const data = JSON.parse(sessionStorage.getItem(ACCESS_KEY) || '{}');
    data[category] = true;
    sessionStorage.setItem(ACCESS_KEY, JSON.stringify(data));
}

export async function verifyAccess({ user, code, categoryAccess }) {
    const hash = sha256(code);
    const res = await fetch("/api/verify", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ user, hash, categoryAccess }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.warn(`❌ Access check failed: ${err?.error || "Unknown error"}`);
        return false;
    }

    const data = await res.json();
    return data.ok === true;
}
