import Mainpage from "../pages/Mainpage.jsx";

const routes = [
    {
        path: '/',
        element: <Mainpage />,
        title: '메인페이지',
        requireAuth: false
    },
];

export default routes;