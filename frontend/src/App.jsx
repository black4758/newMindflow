import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Navbar from "./components/layout/Navbar"
import Sidebar from "./components/layout/Sidebar"
// import MainPage from "./pages/MainPage"
// import MindmapPage from "./pages/MindmapPage"
import routes from "./routes"

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-[#353a3e]">
        {/* 사이드바 */}
        <Sidebar />

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 flex flex-col">
          {/* 상단 네비바 */}
          <Navbar />

          {/* 실제 페이지 컨텐츠 영역 */}
          <main className="flex-1 px-5">
            <Routes>
              {routes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App
