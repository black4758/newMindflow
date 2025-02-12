import { useState, useEffect, useRef } from "react"
import { Menu, Search, ExternalLink, Network, MoreHorizontal } from "lucide-react"
import { useNavigate } from "react-router-dom"
import api from "../../api/axios.js"
import { useSelector } from "react-redux"

const Sidebar = ({ onOpenModal, refreshTrigger, setRefreshTrigger, onChatRoomSelect, currentChatRoom, setCurrentChatRoom }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navigate = useNavigate()
  const userId = useSelector((state) => state.auth.user.userId)

  // 채팅방 관련 상태
  const [allChatRooms, setAllChatRooms] = useState([]) // 모든 채팅방 저장
  const [isLoading, setIsLoading] = useState(false)


  // 스크롤 감지를 위한 ref
  const containerRef = useRef(null)

  // 채팅방 목록 불러오기
  const handleChatRooms = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/api/chatroom/my-rooms/${userId}`)
      setAllChatRooms(response.data)
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false)
    }
  }

  // 채팅방 삭제
  const handleDeleteRooms = async (currentChatRoom, setCurrentChatRoom) => {

  }

  // 채팅방 분류 함수
  const categorizeRooms = (rooms) => {
    if (!rooms || rooms.length === 0) return { todayRooms: [], recentRooms: [] }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const todayRooms = rooms.filter((room) => {
      const chatDate = new Date(room.createdAt)
      return chatDate >= today
    })

    const recentRooms = rooms.filter((room) => {
      const chatDate = new Date(room.createdAt)
      // today 이전의 채팅방만 최근 7일에 표시
      return chatDate >= weekAgo && chatDate < today
    })

    return {
      todayRooms,
      recentRooms,
    }
  }

  // 초기 로딩
  useEffect(() => {
    handleChatRooms()
  }, [refreshTrigger])

  //대화 목록을 클릭했을 시의 핸들러
  const handleChatRoomClick = (roomId) => {
    onChatRoomSelect(roomId)

    if (location.pathname !== "/") {
      navigate("/")
    }
  }

  return (
    <div className={`${isCollapsed ? "w-16" : "w-64"} bg-[#1a1a1a] p-4 flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-end"} gap-2 mb-8`}>
        <button className="p-1 rounded hover:bg-gray-200 transition-colors" onClick={() => setIsCollapsed(!isCollapsed)}>
          <Menu className="w-6 h-6 text-[#ffffff]" />
        </button>
        {!isCollapsed && (
          <>
            <button className="p-1 rounded hover:bg-gray-200 transition-colors" onClick={onOpenModal}>
              <Search className="w-6 h-6 text-[#ffffff]" />
            </button>
            <button
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              onClick={() => {
                onChatRoomSelect(null)
                navigate("/", { state: { refresh: Date.now() } })
              }}
            >
              <ExternalLink className="w-6 h-6 text-[#ffffff]" />
            </button>
            <button className="p-1 rounded hover:bg-gray-200 transition-colors" onClick={() => navigate("/mindmap")}>
              <Network className="w-6 h-6 text-[#ffffff]" />
            </button>
          </>
        )}
      </div>

      {/* Navigation Sections */}
      {!isCollapsed && (
        <div ref={containerRef} className="space-y-8 overflow-y-auto flex-1">
          {/* 오늘 채팅방 */}
          <div className="mb-6">
            <h2 className="text-[#ffffff] mb-2">오늘</h2>
            <div className="flex flex-col gap-2">
              {categorizeRooms(allChatRooms).todayRooms.map((chatRoom) => (
                <div key={`today-${chatRoom.id}`} className="flex items-center gap-2">
                  <button
                    onClick={() => handleChatRoomClick(chatRoom.id)}
                    className={`
                      relative w-full px-4 py-2 rounded-full
                      ${currentChatRoom === chatRoom.id ? "bg-gray-700" : "bg-gray-800"}
                      text-white transition-all duration-300
                      overflow-hidden hover:bg-gray-700
                      hover:shadow-neon group
                    `}
                  >
                    <span className="relative z-10">{chatRoom.title}</span>
                    <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-neon-shine"></div>
                  </button>
                  <button
                    onClick={() => {
                      console.log("클릭")
                    }}
                    className="p-1 hover:bg-gray-600 rounded-full"
                  >
                    <MoreHorizontal className="w-5 h-5 text-[#ffffff]" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 최근 7일 채팅방 */}
          <div>
            <h2 className="text-[#ffffff] mb-2">지난 7일</h2>
            <div className="flex flex-col gap-2">
              {categorizeRooms(allChatRooms).recentRooms.map((chatRoom) => (
                <div key={`recent-${chatRoom.id}`} className="flex items-center gap-2">
                  <button
                    onClick={() => handleChatRoomClick(chatRoom.id)}
                    className={`
                    relative w-full px-4 py-2 rounded-full
                    ${currentChatRoom === chatRoom.id ? "bg-gray-700" : "bg-gray-800"}
                    text-white transition-all duration-300
                    overflow-hidden hover:bg-gray-700
                    hover:shadow-neon group
                  `}
                  >
                    <span className="relative z-10">{chatRoom.title}</span>
                    <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-neon-shine"></div>
                  </button>
                  <button
                    onClick={() => {
                      console.log("클릭")
                    }}
                    className="p-1 hover:bg-gray-600 rounded-full"
                  >
                    <MoreHorizontal className="w-5 h-5 text-[#ffffff]" />
                  </button>
                </ div>
              ))}
            </div>
          </div>
          {/* 로딩 인디케이터 */}
          {isLoading && <div className="text-center py-2 text-white">로딩 중...</div>}
        </div>
      )}
    </div>
  )
}

export default Sidebar
