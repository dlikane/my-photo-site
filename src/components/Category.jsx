import { useParams } from "react-router-dom";

const Category = () => {
    const { categoryName } = useParams();
    return (
        <div className="page-container">
            <h2>{categoryName}</h2>
        </div>
    );
};

export default Category;
