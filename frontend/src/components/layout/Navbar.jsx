import React from "react"
import { User, Bell, Settings } from "lucide-react"

const Navbar = () => {
  return (
    <nav className="h-14 flex items-center justify-end px-4">
      {/* 우측 아이콘들만 유지 */}
      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <Bell size={20} className="text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <Settings size={20} className="text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <User size={20} className="text-gray-600" />
        </button>
      </div>
    </nav>
  )
}

export default Navbar
