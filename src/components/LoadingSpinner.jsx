import { CameraIcon } from "@heroicons/react/24/outline";

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-300 animate-pulse">
        <CameraIcon className="h-10 w-10 animate-spin-slow mb-2" />
        <p className="text-sm uppercase tracking-wide">Loading gallery...</p>
    </div>
);

export default LoadingSpinner;
