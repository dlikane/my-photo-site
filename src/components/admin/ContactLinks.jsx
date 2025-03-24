import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { iconMap } from "../../lib/icons.js"

const ContactLinks = ({ contacts }) => {
    if (!contacts) return null

    const renderLink = (label, value) => {
        if (!value) return null

        let href = "#"
        switch (label) {
            case "instagram":
                href = `https://instagram.com/${value.replace(/^@/, "")}`
                break
            case "whatsapp":
                href = `https://wa.me/${value.replace(/\D/g, "")}`
                break
            case "telegram":
                href = `https://t.me/${value.replace(/^@/, "")}`
                break
            case "messenger":
                href = `https://m.me/${value}`
                break
            case "mobile":
                href = `tel:${value}`
                break
            default:
                href = value
        }

        return (
            <li key={label} className="flex items-center gap-2 text-sm">
                <FontAwesomeIcon icon={iconMap[label] || iconMap.mobile} className="text-gray-500" />
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                >
                    {value}
                </a>
            </li>
        )
    }

    return <ul className="space-y-1">{Object.entries(contacts).map(([label, value]) => renderLink(label, value))}</ul>
}

export default ContactLinks
