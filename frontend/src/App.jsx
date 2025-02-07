import React, { useState } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Navbar from "./components/layout/Navbar"
import Sidebar from "./components/layout/Sidebar"
import SearchModal from "./components/common/SearchModal.jsx"
import routes from "./routes"
import "./index.css"

function App() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Router>
      <div className="flex h-screen bg-[#353a3e]">
        {/* 사이드바 & 모달*/}
        <Sidebar onOpenModal={() => setIsOpen(!isOpen)} />

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 flex flex-col">
          {/* 상단 네비바 */}
          <Navbar />

          {/* 실제 페이지 컨텐츠 영역 */}
          <main className="flex-1 px-5">
            {/* 모달 */}
            <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
              {/* 모달 내용 */}
              <h2>모달</h2>
            </SearchModal>
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
