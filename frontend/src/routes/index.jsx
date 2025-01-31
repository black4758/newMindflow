import Mainpage from "../pages/Mainpage.jsx";
import Login from "../pages/Login.jsx";

const routes = [
    {
        path: '/',
        element: <Mainpage />,
        title: '메인페이지',
        requireAuth: false
    },
    {
        path: '/login/',
        element: <Login />,
        title: '로그인페이지',
        requireAuth: false
    },
];

export default routes;