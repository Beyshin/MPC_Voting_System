import {useAuth} from "../context/AuthContext.jsx";
import {Navigate} from "react-router-dom";


export default function ProtectedRoute({children}) {
    const {user, isLoading} = useAuth();

    if (isLoading) {
        return (
            <div>Ładowanie...</div>
        )
    }

    if(!user){
        return <Navigate to="/login" replace></Navigate>
    }

    return children;
}