import { useRef, useEffect, useState, useCallback } from "react"
import { ArrowUpCircle, ChevronDown } from "lucide-react"
import ModelCard from "../components/common/ModelCard.jsx"
import api from "../api/axios.js"
import { useSelector } from "react-redux"
import { io } from "socket.io-client"

// WebSocket 연결 설정
// - localhost:5001 서버와 웹소켓 연결
// - websocket 전송 방식 사용
// - 재연결 시도 최대 5회, 1초 간격으로 시도
const socket = io("http://localhost:5001", {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
})

// 메인 페이지 컴포넌트
const MainPage = () => {
  // ===== Refs =====
  // textarea의 높이를 동적으로 조절하기 위한 ref
  const textareaRef = useRef(null)
  // 새 메시지가 추가될 때 자동 스크롤을 위한 ref
  const messagesEndRef = useRef(null)

  // ===== State 관리 =====
  // 채팅 관련 상태
  const [messages, setMessages] = useState([]) // 전체 채팅 메시지 목록
  const [userInput, setUserInput] = useState("") // 사용자 입력 텍스트
  const [firstUserInput, setFirstUserInput] = useState("") // 첫 번째 사용자 메시지 저장
  const [streamingText, setStreamingText] = useState("") // 현재 스트리밍 중인 텍스트

  // 모델 관련 상태
  const [model, setModel] = useState("") // 현재 선택된 AI 모델
  const [detailModel, setDetailModel] = useState("") // 선택된 모델의 세부 버전
  const [showModelCards, setShowModelCards] = useState(false) // 모델 선택 카드 표시 여부
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false) // 모델 드롭다운 메뉴 상태

  // 채팅방 관련 상태
  const [chatRoomId, setChatRoomId] = useState(0) // 현재 채팅방 ID

  // 각 모델별 스트리밍 응답을 저장하는 상태
  const [modelStreamingTexts, setModelStreamingTexts] = useState({
    chatgpt: "",
    claude: "",
    google: "",
    clova: "",
  })

  // Redux에서 현재 로그인한 사용자 ID 가져오기
  const userId = useSelector((state) => state.auth.user.userId)

  // ===== 상수 정의 =====
  // 사용 가능한 AI 모델 목록
  const modelList = ["chatgpt", "claude", "google", "clova"]
  // 각 모델별 세부 버전 목록
  const detailModelList = {
    chatgpt: ["gpt-3.5-turbo", "gpt-4o", "gpi-4o-mini", "gpt-o1"],
    claude: ["claude-3-5-sonnet-latest", "claude-3-opus", "claude-3.5-haiku"],
    google: ["gemini-2.0-flash-exp", "gemini-1.5-pro"],
    clova: ["HCX-003", "clova-studio-basic"],
  }

  // ===== useEffect 훅 =====
  // textarea 높이 자동 조절
  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current)
    }
  }, [userInput])

  // 새 메시지 추가시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 스트리밍 종료 콜백 함수 - 메모이제이션
  const handleStreamEndCallback = useCallback(() => {
    setStreamingText("")
  }, [])

  // WebSocket 이벤트 리스너 설정
  useEffect(() => {
    // 연결 성공 이벤트
    socket.on("connect", () => {
      console.log("Socket connected")
    })

    // 연결 에러 이벤트
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
    })

    // 단일 모델 스트리밍 데이터 수신
    socket.on("stream", (data) => {
      console.log("Stream chunk received:", data)
      setStreamingText((prev) => prev + data.content)
    })

    // 모든 모델의 스트리밍 데이터 수신
    socket.on("all_stream", (data) => {
      console.log("All stream chunk received:", data)
      setModelStreamingTexts((prev) => ({
        ...prev,
        [data.model_name]: prev[data.model_name] + data.content,
      }))
    })

    // 스트리밍 종료 이벤트
    socket.on("stream_end", handleStreamEndCallback)

    // 에러 이벤트
    socket.on("error", (error) => {
      console.error("Socket error:", error)
    })

    // 컴포넌트 언마운트시 이벤트 리스너 제거
    return () => {
      socket.off("stream")
      socket.off("all_stream")
      socket.off("stream_end")
      socket.off("error")
    }
  }, [handleStreamEndCallback])

  // **모델 선택 시 처리**
  const handleModelSelect = async (modelName) => {
    console.log("Current userId:", userId)

    if (!userId) {
      console.error("유효하지 않은 사용자 ID")
      return
    }

    // responses 대신 modelStreamingTexts 사용
    const streamingText = modelStreamingTexts[modelName]

    setModel(modelName)
    // 기본 detail_model 설정
    setDetailModel(detailModelList[modelName][0])
    setShowModelCards(false)

    const aiMessage = {
      text: streamingText, // 스트리밍으로 받은 텍스트 사용
      isUser: false,
      model: modelName,
    }
    setMessages((prev) => [...prev, aiMessage])

    try {
      const response = await api.post("/api/messages/choiceModel", {
        userInput: firstUserInput,
        answer: streamingText, // 스트리밍으로 받은 텍스트 사용
        creatorId: userId,
        detail_model: detailModelList[modelName][0], // 기본 detail_model 사용
      })

      setChatRoomId(response.data.chatRoomId)
      // 모든 모델의 스트리밍 텍스트 초기화
      setModelStreamingTexts({
        chatgpt: "",
        claude: "",
        google: "",
        clova: "",
      })
    } catch (error) {
      console.error("모델 선택 오류:", error)
    }
  }

  // **메시지 전송 처리**
  const handleMessageSend = async (e) => {
    e.preventDefault()
    if (!userInput.trim()) return

    // 사용자 메시지를 즉시 화면에 표시
    const userMessage = {
      text: userInput,
      isUser: true,
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      if (!model) {
        // 첫 메시지일 때는 모델 선택 카드를 즉시 표시
        setFirstUserInput(userInput)
        setShowModelCards(true)
        setModelStreamingTexts({
          chatgpt: "",
          claude: "",
          google: "",
          clova: "",
        })
        await api.post("/api/messages/all", { userInput })
      } else {
        // 이후 메시지: 선택된 모델과 대화
        const response = await api.post("/api/messages/send", {
          chatRoomId: chatRoomId,
          model: model,
          userInput,
          creatorId: userId,
          detailModel,
        })

        const { chat_room_id, response: aiResponse } = response.data

        // 스트리밍 텍스트를 최종 응답으로 바로 교체
        setStreamingText(aiResponse)
        setChatRoomId(chat_room_id)

        // 스트리밍 애니메이션 효과 제거를 위한 약간의 지연
        requestAnimationFrame(() => {
          const aiMessage = {
            text: aiResponse,
            isUser: false,
            model: model,
          }
          setMessages((prev) => [...prev, aiMessage])
          setStreamingText("")
        })
      }
    } catch (error) {
      console.error("메시지 전송 오류:", error)
      setStreamingText("")
    }
    setUserInput("")
  }

  // **모델 아이콘 경로 반환**
  const getModelIcon = (modelName) => `/icons/${modelName}.svg`

  // **모델 드롭다운 토글**
  const toggleModelDropdown = () => {
    setIsModelDropdownOpen(!isModelDropdownOpen)
  }

  // **모델 변경 처리**
  const changeModel = (modelName) => {
    setModel(modelName)
    setDetailModel(detailModelList[modelName][0])
  }
  // **세부 모델 변경 처리**
  const changeDetailModel = (detailModelName) => {
    setDetailModel(detailModelName)
    setIsModelDropdownOpen(false)
  }

  // **텍스트 영역 높이 조절**
  const adjustTextareaHeight = (element) => {
    element.style.height = "auto"
    const newHeight = Math.min(element.scrollHeight, 5 * 24) // 최대 5줄까지만 확장
    element.style.height = `${newHeight}px`
  }

  // **입력 변경 처리**
  const handleInputChange = (e) => {
    setUserInput(e.target.value)
    adjustTextareaHeight(e.target)
  }

  // **렌더링**
  return (
    <div className="h-full overflow-hidden p-4 relative" id="modal-root">
      {/* 메시지 표시 영역 */}
      <div className="h-[calc(100%-80px)] overflow-y-auto mb-4">
        {/* 이전 메시지들 표시 */}
        {messages.map((message, index) => (
          <div key={index} className="mb-4">
            {" "}
            {/* 각 메시지를 구분하기 위한 마진 추가 */}
            <ModelCard text={message.text} isUser={message.isUser} model={message.model} />
          </div>
        ))}

        {/* 스트리밍 중일 때만 임시로 표시되는 메시지 */}
        {streamingText && (
          <div className="mb-4">
            <ModelCard text={streamingText} isUser={false} model={model} className="animate-pulse" />
          </div>
        )}
        <div ref={messagesEndRef} />

        {/* 모델 선택 카드 영역 */}
        {showModelCards && (
          <div className="grid grid-cols-2 gap-4 mt-4 max-w-[calc(100%-10rem)] mx-auto">
            {Object.entries(modelStreamingTexts).map(([modelName, streamingText]) => (
              <div key={modelName} className="bg-[#e0e0e0] p-3 rounded-lg cursor-pointer hover:bg-[#EFEFEF] transition-colors" onClick={() => handleModelSelect(modelName)}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5">
                    <img src={getModelIcon(modelName)} alt={`${modelName} icon`} className="w-full h-full object-contain" />
                  </span>
                  <span className="text-gray-800 capitalize text-sm">{modelName}</span>
                </div>
                <p className="text-sm text-gray-600">{streamingText || <span className="animate-pulse">응답을 생성하는 중...</span>}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 채팅 입력 폼 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-1/2 flex gap-2">
        <form onSubmit={handleMessageSend} className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={userInput}
            onChange={handleInputChange}
            rows={1}
            className="w-full px-4 py-2 pr-12 rounded-lg bg-[#e0e0e0] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FFD26F] resize-none overflow-y-auto"
            style={{ minHeight: "40px", maxHeight: "120px", lineHeight: "24px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleMessageSend(e)
              }
            }}
          />
          <button type="submit" className="absolute right-2 top-[8px] text-gray-600 hover:text-[#FBFBFB]">
            <ArrowUpCircle size={24} />
          </button>
        </form>

        {/* 모델 선택 드롭다운 */}
        {model && (
          <div className="relative">
            <button onClick={toggleModelDropdown} className="h-[40px] px-4 rounded-lg bg-[#e0e0e0] text-gray-800 hover:bg-[#EFEFEF] flex items-center gap-2">
              <img src={getModelIcon(model)} alt={model} className="w-5 h-5 object-contain" />
              <span className="capitalize">{model}</span>
              <ChevronDown size={16} />
            </button>

            {/* 드롭다운 메뉴 */}
            {isModelDropdownOpen && (
              <div className="absolute bottom-full mb-2 right-0 flex gap-2">
                <div className="w-40 bg-white rounded-lg shadow-lg py-2">
                  {modelList.map((modelName) => (
                    <button
                      key={modelName}
                      onClick={() => changeModel(modelName)}
                      className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-100 ${modelName === model ? "bg-gray-50" : ""}`}
                    >
                      <img src={getModelIcon(modelName)} alt={modelName} className="w-5 h-5 object-contain" />
                      <span className="capitalize">{modelName}</span>
                    </button>
                  ))}
                </div>
                {/* 세부 모델 목록 드롭다운 */}
                {model && (
                  <div className="w-56 bg-white rounded-lg shadow-lg py-2">
                    <div className="px-4 py-2 text-sm font-medium text-gray-600 border-b border-gray-100"></div>
                    {detailModelList[model].map((detailModelName) => (
                      <button
                        key={detailModelName}
                        onClick={() => changeDetailModel(detailModelName)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${detailModelName === detailModel ? "bg-gray-50" : ""}`}
                      >
                        {detailModelName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MainPage
