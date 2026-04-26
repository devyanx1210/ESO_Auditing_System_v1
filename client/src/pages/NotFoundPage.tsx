import { Link } from "react-router-dom";
import "../../styles/index.css";

const NotFoundPage = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 px-6">
            <div className="text-center max-w-md">

                {/* Big 404 */}
                <h1 className="text-7xl font-extrabold text-primary mb-4">
                    404
                </h1>

                {/* Message */}
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    Page Not Found
                </h2>

                <p className="text-gray-600 mb-6">
                    The page you are looking for doesn’t exist or may have been moved.
                </p>

                {/* Button */}
                <Link
                    to="/"
                    className="inline-block bg-primary text-white px-6 py-3 rounded-lg shadow hover:opacity-90 transition"
                >
                    Go Back Home
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;
