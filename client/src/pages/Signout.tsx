import { useNavigate } from 'react-router-dom';

// TODO Transfer data from the admin layout to sign out for "no" button

export default function Signout() {
    const navigate = useNavigate();

    function handleLogout() {
        localStorage.clear();
        navigate("/");
    }

    return (
        <div className='signout bg-white h-[200px] w-[400px] ' >
            <h1>Sign Out</h1>
            <p>Are you sure you want to sign out?</p>
            <button onClick={handleLogout} >Yes</button>
            <button>No</button>
        </div>
    )
}
