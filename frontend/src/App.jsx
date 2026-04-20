import DashboardPage from "./pages/DashboardPage";
import {Routes, Route} from 'react-router-dom';
import ElectionPage from "./pages/ElectionPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";


export default function App() {
    return(
        <Routes>
          <Route path="/" element={<DashboardPage/>}/>
          <Route path="/election" element={<ElectionPage/>}/>
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/register" element={<RegisterPage/>}/>
        </Routes>
    )
}
