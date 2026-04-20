import DashboardPage from "./pages/DashboardPage";
import {Routes, Route} from 'react-router-dom';
import ElectionPage from "./pages/ElectionPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import {AuthProvider} from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";


export default function App() {
    return(
        <AuthProvider>
            <Routes>
                {/*chronione (trzeba byc zalogowanym route'y*/}
                <Route path="/" element={<ProtectedRoute><DashboardPage/></ProtectedRoute>}/>
                <Route path="/election" element={<ProtectedRoute><ElectionPage/></ProtectedRoute>}/>

                {/*publiczne route'y*/}
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/register" element={<RegisterPage/>}/>
            </Routes>
        </AuthProvider>
    )
}
