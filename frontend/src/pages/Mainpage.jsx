/* eslint-disable no-unused-vars */
import React, { useRef, useEffect, useState } from "react"
/* eslint-enable no-unused-vars */
import { ArrowUpCircle, ChevronDown } from "lucide-react"
import ModelCard from "../components/common/ModelCard.jsx"
import { NONEXIST_MODEL, EXIST_MODEL } from "../store/dummyData.js"
import axios from "axios"

const MainPage = () => {
  // 텍스트 영역의 높이를 동적으로 조절하기 위한 Ref
  const textareaRef = useRef(null)
  // 메시지 끝으로 스크롤하기 위한 Ref
  const messagesEndRef = useRef(null)

  // 메시지를 저장하는 상태
  const [messages, setMessages] = useState([])
  // 현재 입력 값을 저장하는 상태
  const [inputValue, setInputValue] = useState("")
  // 첫 번째 메시지인지 확인하는 상태
  const [isFirstMessage, setIsFirstMessage] = useState(true)
  // 선택된 모델을 저장하는 상태
  const [selectedModel, setSelectedModel] = useState(null)
  // 모델 카드를 보여줄지 여부를 저장하는 상태
  const [showModelCards, setShowModelCards] = useState(false)
  // 모델 드롭다운을 토글하는 상태
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)

  // 사용 가능한 모델 목록
  const modelList = ["chatgpt", "claude", "gemini", "clova"]

  // 메시지가 변경될 때마다 텍스트 영역의 높이를 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [messages])

  // 새로운 메시지가 추가될 때 메시지 끝으로 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 모델 선택 처리
  const handleModelSelect = async (modelName) => {
    setSelectedModel(modelName)
    setIsFirstMessage(false)
    setShowModelCards(false)

    // 더미 데이터 --> 첫 번째 메시지 다음에 선택된 모델의 응답 추가
    // const selectedResponse = {
    //   text: NONEXIST_MODEL.responses[modelName].content,
    //   isUser: false,
    //   model: modelName,
    // }

    try {
      const response = await axios.get(`api_url?model=$(modelName)`);
      const selectedResponse = {
        text: response.data.content,
        isUser: false,
        model: modelName,
      };
      // 첫 번째 사용자 메시지와 선택된 모델의 응답만 남김
      setMessages((prev) => [prev[0], selectedResponse])
    } catch (error) {
      console.error(error)
    }
  };

  // 폼 제출 처리
  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputValue.trim()) {
      // 사용자 메시지 추가
      const userMessage = {
        text: inputValue,
        isUser: true,
      }

      setMessages([...messages, userMessage])
      setInputValue("")

      if (isFirstMessage) {
        // 첫 메시지 후 모델 선택 카드 표시
        setShowModelCards(true)
      } else {
        // 선택된 모델로 응답
        const aiMessage = {
          text: EXIST_MODEL.response.content,
          isUser: false,
          model: EXIST_MODEL.model,
          isSelectable: false,
        }
        setMessages((prev) => [...prev, aiMessage])
      }
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
    setSelectedModel(newModel)
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
    setInputValue(e.target.value)
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
            {NONEXIST_MODEL.models.map((modelName) => (
              <div key={modelName} className="bg-[#e0e0e0] p-3 rounded-lg cursor-pointer hover:bg-[#EFEFEF] transition-colors" onClick={() => handleModelSelect(modelName)}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5">
                    <img src={getModelIcon(modelName)} alt={`${modelName} icon`} className="w-full h-full object-contain" />
                  </span>
                  <span className="text-gray-800 capitalize text-sm">{modelName}</span>
                </div>
                <p className="text-sm text-gray-600">{NONEXIST_MODEL.responses[modelName].content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 채팅 입력 폼 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-1/2 flex gap-2">
        <form onSubmit={handleSubmit} className="relative flex-1">
          <textarea
            value={inputValue}
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
                handleSubmit(e)
              }
            }}
          />
          <button type="submit" className="absolute right-2 top-[8px] text-gray-600 hover:text-[#FBFBFB]">
            <ArrowUpCircle size={24} />
          </button>
        </form>

        {/* 모델 선택 드롭다운 */}
        {selectedModel && (
          <div className="relative">
            <button onClick={toggleModelDropdown} className="h-[40px] px-4 rounded-lg bg-[#e0e0e0] text-gray-800 hover:bg-[#EFEFEF] flex items-center gap-2">
              <img src={getModelIcon(selectedModel)} alt={selectedModel} className="w-5 h-5 object-contain" />
              <span className="capitalize">{selectedModel}</span>
              <ChevronDown size={16} />
            </button>

            {/* 드롭다운 메뉴 */}
            {isModelDropdownOpen && (
              <div className="absolute bottom-full mb-2 right-0 w-40 bg-white rounded-lg shadow-lg py-2">
                {modelList.map((model) => (
                  <button
                    key={model}
                    onClick={() => changeModel(model)}
                    className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-100
                      ${selectedModel === model ? "bg-gray-50" : ""}`}
                  >
                    <img src={getModelIcon(model)} alt={model} className="w-5 h-5 object-contain" />
                    <span className="capitalize">{model}</span>
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
