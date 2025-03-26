import { library } from "@fortawesome/fontawesome-svg-core"
import {
    faUser,
    faPhone,
    faNoteSticky,
    faCalendarAlt,
    faPlus,
    faPen,
    faTrash,
    faChevronDown,
    faChevronRight,
    faLockOpen
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
    faPen,
    faTrash,
    faChevronDown,
    faChevronRight,
    faLockOpen,
    faInstagram,
    faWhatsapp,
    faTelegram,
    faFacebookMessenger
)

export const contactTypeMap = {
    name: ["fas", "user"],
    mobile: ["fas", "phone"],
    instagram: ["fab", "instagram"],
    whatsapp: ["fab", "whatsapp"],
    telegram: ["fab", "telegram"],
    messenger: ["fab", "facebook-messenger"]
}

export const iconMap = {
    ...contactTypeMap,
    notes: ["fas", "note-sticky"],
    date: ["fas", "calendar-alt"],
    plus: ["fas", "plus"],
    pen: ["fas", "pen"],
    trash: ["fas", "trash"],
    chevronDown: ["fas", "chevron-down"],
    chevronRight: ["fas", "chevron-right"],
    lockOpen: ["fas", "lock-open"]
}
