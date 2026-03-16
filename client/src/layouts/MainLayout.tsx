import { Outlet } from "react-router-dom";
import "../../styles/index.css";

const MainLayout = () => {
    return (
        <div className="h-screen w-screen">
            <Outlet /> {/* This is where LandingPage will render */}
        </div>
    );
};

export default MainLayout;
