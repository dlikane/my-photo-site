import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    hasAccess,
    grantAccess,
    verifyAccess,
} from "../lib/access.js";
import { getAccessByCategory } from "../lib/catalog.js";
import Login from "./Login.jsx";
import Category from "./Category.jsx";

const CategoryRoute = () => {
    const { categoryName } = useParams();
    const [granted, setGranted] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            console.log("[CategoryRoute] Checking access for:", categoryName);

            const categoryAccess = await getAccessByCategory(categoryName);
            console.log("[CategoryRoute] Access required:", categoryAccess);

            if (!categoryAccess || categoryAccess.length === 0) {
                console.log("[CategoryRoute] Public category — access granted.");
                setGranted(true);
                return;
            }

            if (hasAccess(categoryName)) {
                console.log("[CategoryRoute] Session has access.");
                setGranted(true);
                return;
            }

            console.log("[CategoryRoute] No access — showing prompt.");
            setShowPrompt(true);
        };

        checkAccess();
    }, [categoryName]);

    const handlePromptSubmit = async ({ user, code }) => {
        console.log("[CategoryRoute] Submitting access prompt for:", categoryName);
        const categoryAccess = await getAccessByCategory(categoryName);
        console.log("[CategoryRoute] Required access:", categoryAccess);

        if (!categoryAccess || categoryAccess.length === 0) {
            console.log("[CategoryRoute] No access required, granting.");
            grantAccess(categoryName);
            setGranted(true);
            setShowPrompt(false);
            return true;
        }

        const ok = await verifyAccess({ user, code, categoryAccess });

        if (ok) {
            console.log("[CategoryRoute] Access verified successfully.");
            grantAccess(categoryName);
            setGranted(true);
            setShowPrompt(false);
        } else {
            console.warn("[CategoryRoute] Access verification failed.");
            setGranted(false);
        }

        return ok;
    };

    if (granted === false) {
        console.warn("[CategoryRoute] Denied — redirecting to home.");
        return <Navigate to="/" replace />;
    }

    if (granted === true) {
        console.log("[CategoryRoute] Access granted — rendering category.");
        return <Category />;
    }

    if (showPrompt) {
        console.log("[CategoryRoute] Showing access prompt.");
        return (
            <Login
                category={categoryName}
                onSubmit={handlePromptSubmit}
                onClose={() => setGranted(false)}
            />
        );
    }

    return null;
};

export default CategoryRoute;
