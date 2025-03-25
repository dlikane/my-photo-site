import { library } from "@fortawesome/fontawesome-svg-core"
import {
    faUser,
    faPhone,
    faNoteSticky,
    faCalendarAlt,
    faPlus
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
    faPlus,
    faInstagram,
    faWhatsapp,
    faTelegram,
    faFacebookMessenger
)

// 🔹 Used for contact types only
export const contactTypeMap = {
    name: ["fas", "user"],
    mobile: ["fas", "phone"],
    instagram: ["fab", "instagram"],
    whatsapp: ["fab", "whatsapp"],
    telegram: ["fab", "telegram"],
    messenger: ["fab", "facebook-messenger"]
}

// 🔹 Used everywhere
export const iconMap = {
    ...contactTypeMap,
    notes: ["fas", "note-sticky"],
    date: ["fas", "calendar-alt"],
    plus: ["fas", "plus"]
}
