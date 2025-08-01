// components/CategoryCard.jsx
import { LockClosedIcon } from "@heroicons/react/24/solid";

const CategoryCard = ({ name, image, locked, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg bg-gray-100 shadow-md transition hover:scale-105 dark:bg-gray-800"
        >
            <img
                src={image}
                alt={name}
                className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
            />
            <div className="absolute bottom-0 w-full bg-black/60 py-2 text-center text-sm uppercase tracking-widest text-white flex items-center justify-center gap-2">
                {name}
                {locked && <LockClosedIcon className="h-4 w-4 text-white" />}
            </div>
        </div>
    );
};

export default CategoryCard;
