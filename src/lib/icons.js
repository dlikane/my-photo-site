import { library } from "@fortawesome/fontawesome-svg-core"
import {
    faUser,
    faPhone,
    faNoteSticky,
    faCalendarAlt
} from "@fortawesome/free-solid-svg-icons"
import {
    faInstagram,
    faWhatsapp,
    faTelegram,
    faFacebookMessenger
} from "@fortawesome/free-brands-svg-icons"

library.add(
    faUser,
    faPhone,
    faNoteSticky,
    faCalendarAlt,
    faInstagram,
    faWhatsapp,
    faTelegram,
    faFacebookMessenger
)

export const iconMap = {
    name: ["fas", "user"],
    mobile: ["fas", "phone"],
    instagram: ["fab", "instagram"],
    whatsapp: ["fab", "whatsapp"],
    telegram: ["fab", "telegram"],
    messenger: ["fab", "facebook-messenger"],
    notes: ["fas", "note-sticky"],
    date: ["fas", "calendar-alt"]
}
