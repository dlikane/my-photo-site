import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faWhatsapp } from "@fortawesome/free-brands-svg-icons";

const Footer = () => {
    return (
        <footer className="bg-white p-4 text-center text-sm text-gray-600 dark:bg-black dark:text-gray-400">
            <div className="flex justify-center items-center gap-6">
                <a
                    href="https://instagram.com/dlikane"
                    className="flex items-center gap-1 text-black hover:underline dark:text-white"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <FontAwesomeIcon icon={faInstagram} className="text-pink-600" />
                    @dlikane
                </a>
                <a
                    href="https://wa.me/61416269911"
                    className="flex items-center gap-1 text-black hover:underline dark:text-white"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <FontAwesomeIcon icon={faWhatsapp} className="text-green-600" />
                    WhatsApp
                </a>
            </div>
        </footer>
    );
};

export default Footer;
