import React from "react"
import { User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { logout } from "../../store/slices/authSlice"

const Navbar = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleLogout = async () => {
    try {
      dispatch(logout())
      navigate("/login")
    } catch (error) {
      console.error("로그아웃 실패:", error)
    }
  }

  return (
    <nav className="h-14 flex items-center justify-end px-4">
      {/* 우측 아이콘들만 유지 */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate("/profile")} className="p-2 hover:bg-gray-100 rounded-lg">
          <User size={20} className="text-gray-600" />
        </button>
        <button onClick={handleLogout} className="p-2 flex items-center gap-2">
          <span className="text-gray-600 hover:text-gray-100 transition-colors">로그아웃</span>
        </button>
      </div>
    </nav>
  )
}

export default Navbar
