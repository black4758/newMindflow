import axios from "axios"
import { store } from "../store/store"

// axios 인스턴스 생성
const api = axios.create({
  baseURL: "http://localhost:8453", // API의 기본 URL 설정
  withCredentials: true, // 쿠키를 요청에 포함시킬지 여부 설정
  headers: {
    "Content-Type": "application/json", // 요청의 Content-Type을 JSON으로 설정
  },
})

// 요청 인터셉터 추가
api.interceptors.request.use(
  (config) => {
    // Redux store에서 사용자 토큰(accessToken)을 가져옴
    const token = store.getState().auth.user.accessToken
    if (token) {
      // 토큰이 있을 경우 Authorization 헤더에 추가
      config.headers.Authorization = `Bearer ${token}`
    }
    // 수정된 config 반환 (요청이 정상적으로 진행)
    return config
  },
  (error) => {
    // 요청 중 에러 발생 시 Promise.reject로 에러 반환
    return Promise.reject(error)
  }
)

// // 응답 인터셉터 추가
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     // 401 에러 (인증 실패) 발생 시
//     if (error.response?.status === 401) {
//       // 로그인 페이지로 리다이렉트하는 대신 에러를 던짐
//       return Promise.reject(new Error("인증이 필요합니다"))
//     }
//     return Promise.reject(error)
//   }
// )

export default api
