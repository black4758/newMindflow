import MainPage from "../pages/MainPage.jsx";
import Login from "../pages/Login.jsx";
import Signup from "../pages/Signup.jsx"
import Profile from "../pages/Profile.jsx";
import MindmapPage from "../pages/MindmapPage.jsx";
import MindmapPagedetail from "../pages/MindmapPagedetail.jsx";

const routes = [
    {
        path: '/',
        element: <MainPage />,
        title: '메인페이지',
        requireAuth: false
    },
    {
        path: '/login/',
        element: <Login />,
        title: '로그인페이지',
        requireAuth: false
    },
    {
        path: "/signup/",
        element: <Signup />,
        title: "회원가입페이지",
        requireAuth: false,
    },
    {
        path: '/profile/',
        element: <Profile />,
        title: '프로필페이지',
        requireAuth: false
    },
    {
        path: '/mindmap/',
        element: <MindmapPage />,
        title: '마인드맵페이지',
        requireAuth: false
    },
    {
        path: '/mindmap/detail/',
        element: <MindmapPagedetail />,
        title: '마인드맵상세페이지',
        requireAuth: false
    },
];

export default routes
