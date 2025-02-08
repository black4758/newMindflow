import { useState } from "react"
import { Routes, Route, useLocation } from "react-router-dom"
import Navbar from "./Navbar"
import Sidebar from "./Sidebar"
import SearchModal from "../common/SearchModal"
import routes from "../../routes"

const AppLayout = () => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const isAuthPage = ["/login", "/signup"].includes(location.pathname)

  if (isAuthPage) {
    return (
      <div className="h-screen bg-[#353a3e]">
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Routes>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#353a3e]">
      <Sidebar onOpenModal={() => setIsOpen(!isOpen)} />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 px-5">
          <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
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
  )
}

export default AppLayout 