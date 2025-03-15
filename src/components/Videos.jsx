import { useParams } from "react-router-dom";

const Videos = () => {
    const { videoType } = useParams();
    return (
        <div className="page-container">
            <h2>{videoType}</h2>
        </div>
    );
};

export default Videos;
