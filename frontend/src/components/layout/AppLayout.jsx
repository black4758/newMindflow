// 필요한 리액트 훅과 컴포넌트들을 임포트
import React, { useState } from "react"
import { Routes, Route, useLocation } from "react-router-dom"
import Navbar from "./Navbar"
import Sidebar from "./Sidebar"
import SearchModal from "../common/SearchModal"
import routes from "../../routes"

const AppLayout = () => {
  // 채팅방이 새로 생성되었는지 아닌지의 상태를 관리하는 state
  const [refreshTrigger, setRefreshTrigger] = useState(false)
  // 검색 모달의 열림/닫힘 상태를 관리하는 state
  const [isOpen, setIsOpen] = useState(false)
  // 현재 라우트 위치 정보를 가져오는 훅
  const location = useLocation()

  // 현재 경로가 인증 페이지인지 확인
  const isAuthPage = ["/login", "/signup"].includes(location.pathname)

  // 인증 페이지일 경우 간단한 레이아웃 반환
  if (isAuthPage) {
    return (
      <div className="h-screen bg-[#353a3e]">
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Routes>
      </div>
    )
  }

  // 일반 페이지일 경우 전체 레이아웃 반환
  return (
    <div className="flex h-screen bg-[#353a3e]">
      {/* 사이드바 컴포넌트 - 모달 열기/닫기 함수 전달 */}
      <Sidebar onOpenModal={() => setIsOpen(!isOpen)} refreshTrigger={refreshTrigger} setRefreshTrigger={setRefreshTrigger} />
      <div className="flex-1 flex flex-col">
        {/* 상단 네비게이션 바 */}
        <Navbar />
        {/* 메인 컨텐츠 영역 */}
        <main className="flex-1 px-5 overflow-y-auto">
          {/* 검색 모달 컴포넌트 */}
          <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
          {/* 라우트에 따른 컴포넌트 렌더링 */}
          <Routes>
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  route.path === "/"
                    ? React.cloneElement(route.element, {
                        setRefreshTrigger: setRefreshTrigger,
                      })
                    : route.element
                }
              />
            ))}
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
