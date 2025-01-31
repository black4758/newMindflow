import React, { useReducer, useRef, useEffect, useState } from "react";
import { ArrowUpCircle } from 'lucide-react';
import ModelCard from "../components/common/ModelCard.jsx";
import { NONEXIST_MODEL, EXIST_MODEL } from "../store/dummyData.js";
import { chatReducer, initialState, ACTIONS } from "../store/chat/chatReducer.js";

const Mainpage = () => {
    const [state, dispatch] = useReducer(chatReducer, initialState);
    const [showModelSelection, setShowModelSelection] = useState(false);
    const [messageCount, setMessageCount] = useState(0);
    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [state.user_message]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [state.messages]);

    const handleModelSelect = (model, response) => {
        const assistantMessage = {
            id: Date.now() + 1,
            text: response,
            timestamp: new Date().toLocaleTimeString(),
            sender: 'assistant',
            model: model
        };

        dispatch({ type: ACTIONS.ADD_MESSAGE, payload: assistantMessage });
        setShowModelSelection(false);
    };

    const handleSendMessage = () => {
        if (state.user_message.trim()) {
            const userMessage = {
                id: Date.now(),
                text: state.user_message.trim(),
                timestamp: new Date().toLocaleTimeString(),
                sender: 'user'
            };

            dispatch({ type: ACTIONS.ADD_MESSAGE, payload: userMessage });

            // 첫 메시지인 경우 NONEXIST_MODEL, 이후는 EXIST_MODEL 사용
            const dummyResponse = messageCount === 0 ? NONEXIST_MODEL : EXIST_MODEL;
            setMessageCount(prev => prev + 1); // 메시지 카운트 증가

            // 모델 존재 여부 확인
            if (dummyResponse?.["model"]) {
                // 단일 모델 응답
                const assistantMessage = {
                    id: Date.now() + 1,
                    text: dummyResponse["response"]["content"],
                    timestamp: new Date().toLocaleTimeString(),
                    sender: 'assistant',
                    model: dummyResponse["model"]
                };

                setTimeout(() => {
                    dispatch({ type: ACTIONS.ADD_MESSAGE, payload: assistantMessage });
                }, 1000);
            } else if (dummyResponse?.["models"]) {
                // 다중 모델 응답
                const modelResponses = dummyResponse["models"].map(model => ({
                    models: model,
                    response: dummyResponse["responses"][model]["content"]
                }));

                setShowModelSelection(true);
                dispatch({
                    type: ACTIONS.SET_MULTI_MODEL_RESPONSES,
                    payload: modelResponses
                });
            }

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
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">환영합니다!</h1>
                    <p className="text-lg text-gray-600">무엇을 도와드릴까요?</p>
                </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-4">
                <div className="max-w-4xl mx-auto">
                    {state.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                      >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              msg.sender === 'user' ? 'bg-gray-200' : 'bg-white'
                            }`}
                          >
                              {msg.model && (
                                <div className="text-xs text-gray-500 mb-1">
                                    {msg.model}
                                </div>
                              )}
                              <p className="break-words">{msg.text}</p>
                          </div>
                      </div>
                    ))}
                    {showModelSelection && state.multiModelResponses && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                          {state.multiModelResponses.map((item, index) => (
                            <ModelCard
                              key={index}
                              model={item.models}
                              response={item.response}
                              onSelect={handleModelSelect}
                            />
                          ))}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
          )}

          <div className="w-full p-4 bg-white">
              <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-center gap-2">
                      <div className="min-w-[70%] bg-gray-100 rounded-2xl px-4 py-2 border relative">
                            <textarea
                              ref={textareaRef}
                              value={state.user_message}
                              onChange={(e) => dispatch({
                                  type: ACTIONS.SET_MESSAGE,
                                  payload: e.target.value
                              })}
                              onKeyDown={handleKeyPress}
                              className="w-full bg-gray-100 outline-none pr-10 resize-none overflow-hidden min-h-[40px] max-h-[200px]"
                              placeholder="메시지를 입력하세요..."
                            />
                          <button
                            onClick={handleSendMessage}
                            disabled={!state.user_message.trim()}
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