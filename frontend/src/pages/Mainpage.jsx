import React, { useReducer, useRef, useEffect } from "react";
import { ArrowUpCircle } from 'lucide-react';
import '../styles/style.css';

const initialState = {
    message: '',
    isHovered: false,
    messages: [],
};

const ACTIONS = {
    SET_MESSAGE: 'SET_MESSAGE',
    CLEAR_MESSAGE: 'CLEAR_MESSAGE',
    SET_HOVER: 'SET_HOVER',
    ADD_MESSAGE: 'ADD_MESSAGE',
};

const chatReducer = (state, action) => {
    switch (action.type) {
        case ACTIONS.SET_MESSAGE:
            return { ...state, message: action.payload };
        case ACTIONS.CLEAR_MESSAGE:
            return { ...state, message: '' };
        case ACTIONS.SET_HOVER:
            return { ...state, isHovered: action.payload };
        case ACTIONS.ADD_MESSAGE:
            return {
                ...state,
                messages: [...state.messages, action.payload]
            };
        default:
            return state;
    }
};

const Mainpage = () => {
    const [state, dispatch] = useReducer(chatReducer, initialState);
    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [state.message]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [state.messages]);

    const handleSendMessage = () => {
        if (state.message.trim()) {
            // 사용자 메시지
            const userMessage = {
                id: Date.now(),
                text: state.message.trim(),
                timestamp: new Date().toLocaleTimeString(),
                sender: 'user'
            };

            // 더미 응답 메시지
            const dummyResponse = {
                id: Date.now() + 1,
                text: "으아아아아아",
                timestamp: new Date().toLocaleTimeString(),
                sender: 'assistant'
            };

            dispatch({ type: ACTIONS.ADD_MESSAGE, payload: userMessage });

            // 응답 메시지를 약간의 딜레이 후 표시
            setTimeout(() => {
                dispatch({ type: ACTIONS.ADD_MESSAGE, payload: dummyResponse });
            }, 1000);

            dispatch({ type: ACTIONS.CLEAR_MESSAGE });
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
      <div className="flex flex-col h-full">
          {state.messages.length === 0 ? (
            // 초기 환영 메시지
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">환영합니다!</h1>
                    <p className="text-lg text-gray-600">무엇을 도와드릴까요?</p>
                </div>
            </div>
          ) : (
            // 채팅 메시지 목록
            <div className="flex-1 overflow-auto p-4">
                <div className="max-w-4xl mx-auto">
                    {state.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                      >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              msg.sender === 'user'
                                ? 'bg-gray-200'
                                : 'bg-white'
                            }`}
                          >
                              <p className="break-words">{msg.text}</p>

                          </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
          )}

          {/* 입력 영역 */}
          <div className="w-full p-4 bg-white">
              <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-center gap-2">
                      <div className="min-w-[70%] bg-gray-100 rounded-2xl px-4 py-2 border relative">
                            <textarea
                              ref={textareaRef}
                              value={state.message}
                              onChange={(e) => dispatch({
                                  type: ACTIONS.SET_MESSAGE,
                                  payload: e.target.value
                              })}
                              onKeyDown={handleKeyPress}
                              className="w-full bg-gray-100 outline-none pr-10 resize-none overflow-hidden min-h-[40px] max-h-[200px] pb-6"
                            />
                          <button
                            onClick={handleSendMessage}
                            disabled={!state.message.trim()}
                            onMouseEnter={() => dispatch({ type: ACTIONS.SET_HOVER, payload: true })}
                            onMouseLeave={() => dispatch({ type: ACTIONS.SET_HOVER, payload: false })}
                            className="absolute right-3 bottom-2 transition-colors disabled:opacity-50 z-10 cursor-pointer"
                          >
                              <ArrowUpCircle
                                className="h-5 w-5 transition-all"
                                stroke="black"
                                fill={state.isHovered ? "#4B5563" : "none"}
                                strokeWidth={state.isHovered ? 2.5 : 2}
                              />
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    );
};

export default Mainpage;