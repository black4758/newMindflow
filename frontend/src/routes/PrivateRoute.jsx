import { Navigate } from "react-router-dom"
import { useSelector } from "react-redux"

/**
 * 인증이 필요한 라우트를 보호하는 함수
 * @param {JSX.Element} element - 렌더링할 리액트 컴포넌트
 * @returns {JSX.Element} - 인증 여부에 따라 원래 컴포넌트 또는 로그인 페이지로 리다이렉트
 */
export const PrivateRoute = ({ element }) => {
  // Redux store에서 유저 정보 가져오기
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  // LocalStorage의 토큰과 redux의 유저 정보 모두 확인하기
  console.log("Auth State:", { isAuthenticated, user })

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  // replace: true -> 브라우저 히스토리에 현재 페이지를 남기지 않음
  // (뒤로 가기 했을 때 이전 페이지로 돌아가지 않게 함)
  return isAuthenticated ? element : <Navigate to="/login" replace />
}
