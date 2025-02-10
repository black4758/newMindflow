import { useState, useEffect } from "react"
import { Menu, Search, ExternalLink, Network } from "lucide-react"
import { useNavigate } from "react-router-dom"
import api from "../../api/axios.js"
import { useSelector } from "react-redux"

const Sidebar = ({onOpenModal}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navigate = useNavigate()

  const userId = useSelector((state) => state.auth.user.userId)
  const [chatRooms, setChatRooms] = useState([])
  const [chatRoomData, setChatRoomData] = useState([])
  const [refreshTrigger, setRefreshTrigger] = useState(false)


  const handleChatRooms = async () => {
    try {
      const response = await api.get(`/api/chatroom/my-rooms/${userId}`)

      setChatRooms(response.data)

      console.log(response.data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    handleChatRooms()
  }, [refreshTrigger])


  




  return (
    <div className={`${isCollapsed ? "w-16" : "w-64"} bg-[#1a1a1a] p-4 flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-end"} gap-2 mb-8`}>
        <button className="p-1 rounded hover:bg-gray-200 transition-colors" onClick={() => setIsCollapsed(!isCollapsed)}>
          <Menu className="w-6 h-6 text-[#ffffff]" />
        </button>
        {!isCollapsed && (
          <>
            <button
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              onClick={onOpenModal}
            >
              <Search className="w-6 h-6 text-[#ffffff]" />
            </button>
            <button 
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              onClick={() => navigate('/')}
            >
              <ExternalLink className="w-6 h-6 text-[#ffffff]" />
            </button>
            <button 
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              onClick={() => navigate('/mindmap')}
            >
              <Network className="w-6 h-6 text-[#ffffff]" />
            </button>
          </>
        )}
      </div>

      {/* Navigation Sections */}
      {!isCollapsed && (
        <div className="space-y-8">
          <div className="mb-6">
            <h2 className="text-[#ffffff] mb-2">오늘</h2>
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4].map((_, index) => (
                <button
                  key={index}
                  className="
                    relative 
                    w-full 
                    px-4 
                    py-2 
                    rounded-full 
                    bg-gray-800 
                    text-white
                    transition-all 
                    duration-300
                    overflow-hidden
                    hover:bg-gray-700
                    hover:shadow-neon
                    group
                  "
                >
                  <span className="relative z-10">메뉴 아이템 {index + 1}</span>
                  <div
                    className="
                      absolute 
                      top-0 
                      -left-full 
                      w-full 
                      h-full 
                      bg-gradient-to-r 
                      from-transparent 
                      via-white/10 
                      to-transparent
                      group-hover:animate-neon-shine
                    "
                  ></div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-[#ffffff] mb-2">지난 일</h2>
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((_, index) => (
                <button
                  key={index}
                  className="
                    relative 
                    w-full 
                    px-4 
                    py-2 
                    rounded-full 
                    bg-gray-800 
                    text-white
                    transition-all 
                    duration-300
                    overflow-hidden
                    hover:bg-gray-700
                    hover:shadow-neon
                    group
                  "
                >
                  <span className="relative z-10">지난 일 {index + 1}</span>
                  <div
                    className="
                      absolute 
                      top-0 
                      -left-full 
                      w-full 
                      h-full 
                      bg-gradient-to-r 
                      from-transparent 
                      via-white/10 
                      to-transparent
                      group-hover:animate-neon-shine
                    "
                  ></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar
