import React, { useRef, useEffect, useState } from "react"
import { ArrowUpCircle, ChevronDown } from "lucide-react"
import ModelCard from "../components/common/ModelCard.jsx"
import axios from "axios"
import { useSelector } from "react-redux"

const MainPage = () => {
  // 텍스트 영역의 높이를 동적으로 조절하기 위한 Ref
  const textareaRef = useRef(null)
  // 메시지 끝으로 스크롤하기 위한 Ref
  const messagesEndRef = useRef(null)

  // 메시지를 저장하는 상태
  const [messages, setMessages] = useState([])
  // 현재 입력 값을 저장하는 상태
  const [userInput, setUserInput] = useState("")
  // 선택된 모델을 저장하는 상태
  const [model, setModel] = useState("")
  // 모델 카드를 보여줄지 여부를 저장하는 상태
  const [showModelCards, setShowModelCards] = useState(false)
  // 모델 드롭다운을 토글하는 상태
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  // 현재 세부 모델
  const [detailModel, setDetailModel] = useState("")
  // 현재 채팅 방의 ID
  const [chatRoomId, setChatRoomId] = useState(0)

  // response 상태 추가
  const [responses, setResponses] = useState({})

  // Redux에서 userId 가져오기
  const userId = useSelector((state) => state.auth.user.id)

  // 디버깅용 userId
  // const userId = 0

  // 사용 가능한 모델 목록
  const modelList = ["chatgpt", "claude", "gemini", "clova"]
  // 세부 모델 목록
  const detailModelList = {
    chatgpt: ["gpt-4o", "gpi-4o-mini", "gpt-o1"],
    claude: ["claude-3.5-sonnet", "claude-3-opus", "claude-3.5-haiku"],
    gemini: ["gemini-1.5-flash-8b", "gemini-1.5-pro"],
    clova: ["clova-studio-exclusive", "clova-studio-basic"],
  }

  // 메시지가 변경될 때마다 텍스트 영역의 높이를 조절
  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current)
    }
  }, [messages])

  // 새로운 메시지가 추가될 때 메시지 끝으로 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  //모델 선택
  const handleModelSelect = (modelName) => {
    setModel(modelName)
    setDetailModel(detailModelList[modelName][0])
    setShowModelCards(false)

      // 선택한 모델의 응답을 채팅 메시지로 추가
    const aiMessage = {
      text: responses[modelName].response,
      isUser: false,
      model: modelName,
      detailModel: responses[modelName].detail_model
    };
    
    setMessages(prev => [...prev, aiMessage]);
  }

  // 메세지 전송 처리
  const handleMessageSend = async (e) => {
    e.preventDefault()

    const requestData = {
      chatRoomId,
      model,
      userInput,
      userId,
      detailModel,
    }

    try {
      const response = await axios.post("http://localhost:5001/api/messages/send", requestData)

      if (response.data.models) {
        const { models, responses } = response.data
        setResponses(responses)
        setShowModelCards(true)
        console.log("가용한 모델들: ", models)
      } else if (response.data.data) {
        const { chat_room_id, model, detail_model, response: aiResponse } = response.data.data
        setChatRoomId(chat_room_id)

        const aiMessage = {
          text: aiResponse,
          isUser: false,
          model,
          detailModel: detail_model,
        }

        setMessages((prev) => [...prev, aiMessage])
      }
    } catch (error) {
      console.error("메세지 전송 오류: ", error)
    }
  }

  // 모델 아이콘 경로 가져오기
  const getModelIcon = (modelName) => {
    return `/icons/${modelName}.svg`
  }

  // 모델 드롭다운 토글
  const toggleModelDropdown = () => {
    setIsModelDropdownOpen(!isModelDropdownOpen)
  }

  // 선택된 모델 변경
  const changeModel = (newModel) => {
    setModel(newModel)
    setIsModelDropdownOpen(false)
  }

  // 텍스트 영역 높이 동적 조절
  const adjustTextareaHeight = (element) => {
    element.style.height = "auto"
    const newHeight = Math.min(element.scrollHeight, 5 * 24) // 24px은 한 줄의 대략적인 높이
    element.style.height = `${newHeight}px`
  }

  // 입력 변경 처리
  const handleInputChange = (e) => {
    setUserInput(e.target.value)
    adjustTextareaHeight(e.target)
  }

  return (
    <div className="h-full p-4 relative" id="modal-root">
      {/* 메시지 표시 영역 */}
      <div className="h-[calc(100%-80px)] overflow-y-auto mb-4">
        {messages.map((message, index) => (
          <ModelCard key={index} text={message.text} isUser={message.isUser} model={message.model} />
        ))}

        {/* 모델 선택 카드 영역 */}
        {showModelCards && (
          <div className="grid grid-cols-2 gap-4 mt-4 max-w-[calc(100%-10rem)] mx-auto">
            {Object.entries(responses).map(([modelName, { response, detail_model }]) => (
              <div key={modelName} className="bg-[#e0e0e0] p-3 rounded-lg cursor-pointer hover:bg-[#EFEFEF] transition-colors" onClick={() => handleModelSelect(modelName, detail_model)}>
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
            style={{
              minHeight: "40px",
              maxHeight: "120px", // 5줄 정도의 높이
              lineHeight: "24px",
            }}
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
              <div className="absolute bottom-full mb-2 right-0 w-40 bg-white rounded-lg shadow-lg py-2">
                {modelList.map((modelName) => (
                  <button
                    key={modelName}
                    onClick={() => changeModel(modelName)}
                    className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-100
                      ${modelName === model ? "bg-gray-50" : ""}`}
                  >
                    <img src={getModelIcon(modelName)} alt={modelName} className="w-5 h-5 object-contain" />
                    <span className="capitalize">{modelName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MainPage
