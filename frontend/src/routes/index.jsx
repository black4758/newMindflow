import MainPage from "../pages/Mainpage.jsx"
import Login from "../pages/Login.jsx"
import MindmapPage from "../pages/MindmapPage.jsx"
import OnedataPage from "../pages/OnedataPage.jsx"
import Signup from "../pages/Signup.jsx"

const routes = [
  {
    path: "/",
    element: <MainPage />,
    title: "메인페이지",
    requireAuth: false,
  },
  {
    path: "/login/",
    element: <Login />,
    title: "로그인페이지",
    requireAuth: false,
  },
  {
    path: "/signup/",
    element: <Signup />,
    title: "회원가입페이지",
    requireAuth: false,
  },
  {
    path: "/mindmap/",
    element: <MindmapPage />,
    title: "마인드맵페이지",
    requireAuth: false,
  },

  {
    path: "/onedata/",
    element: <OnedataPage />,
    title: "강조페이지",
    requireAuth: false,
  },
]

export default routes
