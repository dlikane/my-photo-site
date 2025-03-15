import { useParams } from "react-router-dom";
import VideoFeed from "./VideoFeed"; // ✅ Import VideoFeed

const Videos = () => {
    const { videoType } = useParams();

    return (
        <div className="videos-container">
            {videoType === "music-videos" ? (
                <VideoFeed videos={[
                    { id: "Xyz12345" },
                    { id: "Abc67890" },
                    { id: "Def45678" }
                ]} />
            ) : (
                <h1 className="videos-title">{videoType}</h1>
            )}
        </div>
    );
};

export default Videos;
