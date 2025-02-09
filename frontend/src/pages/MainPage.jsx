import { useRef, useEffect, useState, useCallback } from "react"
import { ArrowUpCircle, ChevronDown } from "lucide-react"
import ModelCard from "../components/common/ModelCard.jsx"
import api from "../api/axios.js"
import { useSelector } from "react-redux"
import { io } from "socket.io-client"

// 메인 페이지 컴포넌트
const MainPage = () => {
  // **Refs 정의**
  // 텍스트 영역 높이를 동적으로 조절하기 위한 ref
  const textareaRef = useRef(null)
  // 메시지 목록이 업데이트될 때 끝으로 자동 스크롤하기 위한 ref
  const messagesEndRef = useRef(null)

  // **State 정의**
  const [messages, setMessages] = useState([]) // 채팅 메시지 목록 상태
  const [userInput, setUserInput] = useState("") // 사용자 입력 상태
  const [model, setModel] = useState("") // 선택된 모델 상태
  const [showModelCards, setShowModelCards] = useState(false) // 모델 카드 표시 여부 상태
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false) // 모델 드롭다운 열림 상태
  const [detailModel, setDetailModel] = useState("") // 선택된 세부 모델 상태
  const [chatRoomId, setChatRoomId] = useState(0) // 현재 채팅 방 ID 상태
  const [responses, setResponses] = useState({}) // 모델별 응답 상태
  const [firstUserInput, setFirstUserInput] = useState("") // 첫 메시지를 위한 state 추가
  const [streamingText, setStreamingText] = useState("") // streaming 상태 제거

  // Redux에서 현재 로그인한 사용자의 userId 가져오기
  const userId = useSelector((state) => state.auth.user.userId)

  // 사용 가능한 모델 목록과 세부 모델 목록
  const modelList = ["chatgpt", "claude", "google", "clova"]
  const detailModelList = {
    chatgpt: ["gpt-3.5-turbo", "gpt-4o", "gpi-4o-mini", "gpt-o1"],
    claude: ["claude-3-5-sonnet-latest", "claude-3-opus", "claude-3.5-haiku"],
    google: ["gemini-2.0-flash-exp", "gemini-1.5-pro"],
    clova: ["HCX-003", "clova-studio-basic"],
  }

  // **useEffect 훅 사용**
  // 메시지가 업데이트될 때마다 텍스트 영역의 높이를 동적으로 조정
  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current)
    }
  }, [userInput])

  // 메시지가 추가될 때 메시지 끝으로 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 메시지 처리 함수를 useCallback으로 분리
  const handleStreamEnd = useCallback(() => {
    setMessages((prev) => {
      const lastMessage = {
        text: streamingText,
        isUser: false,
        model: model,
      }
      return [...prev, lastMessage]
    })
    setStreamingText("")
  }, [model, streamingText])

  useEffect(() => {
    // 웹소켓 서버에 연결 (포트 5001)
    const socket = io("http://localhost:5001")

    // 소켓 연결 성공 시 실행
    socket.on("connect", () => {
      console.log("Socket connected")
    })

    // 스트리밍 데이터를 받을 때마다 실행
    socket.on("stream", (data) => {
      console.log("Stream chunk received:", data) // 받은 데이터 확인용
      setStreamingText((prev) => {
        // 이전 텍스트에 새로운 데이터를 이어붙임
        const newText = prev + data.content
        console.log("Accumulated text:", newText) // 누적된 전체 텍스트 확인용
        return newText
      })
    })

    // 스트리밍이 완료되었을 때 실행
    socket.on("stream_end", () => {
      console.log("Stream ended, final text:", streamingText) // 최종 텍스트 확인용

      // 누적된 스트리밍 텍스트를 메시지 목록에 추가
      setMessages((prev) => {
        const lastMessage = {
          text: streamingText, // 누적된 전체 텍스트
          isUser: false, // AI 응답이므로 false
          model: model, // 현재 선택된 모델
        }
        return [...prev, lastMessage]
      })

      // 스트리밍 텍스트 초기화 (다음 응답을 위해)
      setStreamingText("")
    })

    // 소켓 에러 발생 시 실행
    socket.on("error", (error) => {
      console.error("Socket error:", error)
    })

    // 컴포넌트가 언마운트되거나 model이 변경될 때 소켓 연결 해제
    return () => socket.disconnect()
  }, [model, handleStreamEnd]) // model이나 handleStreamEnd가 변경될 때마다 재실행

  // **모델 선택 시 처리**
  const handleModelSelect = async (modelName) => {
    console.log("Current userId:", userId)

    if (!userId) {
      console.error("유효하지 않은 사용자 ID")
      return
    }

    console.log("Selected model response:", responses[modelName])

    setModel(modelName)
    setDetailModel(responses[modelName].detail_model)
    setShowModelCards(false)

    const aiMessage = {
      text: responses[modelName].response,
      isUser: false,
      model: modelName,
    }
    setMessages((prev) => [...prev, aiMessage])

    try {
      const response = await api.post("/api/messages/choiceModel", {
        userInput: firstUserInput,
        answer: aiMessage.text,
        creatorId: userId,
        detail_model: responses[modelName].detail_model,
      })

      setChatRoomId(response.data.chatRoomId)
    } catch (error) {
      console.error("모델 선택 오류:", error)
      console.error("Error details:", {
        userId,
        response: error.response?.data,
        status: error.response?.status,
        detail_model: responses[modelName].detail_model,
      })
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
        // 첫 메시지: 모든 모델의 응답을 받아옴
        setFirstUserInput(userInput)
        const response = await api.post("/api/messages/all", { userInput })
        const { models, responses } = response.data
        setResponses(responses)
        setShowModelCards(true) // 모델 선택 카드 표시
      } else {
        // 이후 메시지: 선택된 모델과 대화
        const response = await api.post("/api/messages/send", {
          chatRoomId: chatRoomId,
          model: model,
          userInput,
          creatorId: userId,
          detailModel,
        })

        // 응답 처리 (이 부분이 중복의 원인 - 웹소켓에서도 처리함)
        const { chat_room_id, response: aiResponse } = response.data
        const aiMessage = {
          text: aiResponse,
          isUser: false,
          model: model,
        }
        setMessages((prev) => [...prev, aiMessage])
        setChatRoomId(chat_room_id)
      }
    } catch (error) {
      console.error("메시지 전송 오류:", error)
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
    <div className="h-full p-4 relative" id="modal-root">
      {/* 메시지 표시 영역 */}
      <div className="h-[calc(100%-80px)] overflow-y-auto mb-4">
        {messages.map((message, index) => (
          <ModelCard key={index} text={message.text} isUser={message.isUser} model={message.model} />
        ))}

        {/* 스트리밍 중인 텍스트가 있으면 표시 */}
        {streamingText && <ModelCard text={streamingText} isUser={false} model={model} />}

        {/* 모델 선택 카드 영역 */}
        {showModelCards && (
          <div className="grid grid-cols-2 gap-4 mt-4 max-w-[calc(100%-10rem)] mx-auto">
            {Object.entries(responses).map(([modelName, { response }]) => (
              <div key={modelName} className="bg-[#e0e0e0] p-3 rounded-lg cursor-pointer hover:bg-[#EFEFEF] transition-colors" onClick={() => handleModelSelect(modelName)}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5">
                    <img src={getModelIcon(modelName)} alt={`${modelName} icon`} className="w-full h-full object-contain" />
                  </span>
                  <span className="text-gray-800 capitalize text-sm">{modelName}</span>
                </div>
                <p className="text-sm text-gray-600">{response}</p>
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
