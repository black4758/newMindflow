import { useState } from "react";
import axios from "axios";

const Login = () => {
	// 이메일과 비밀번호 입력값을 저장할 state
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState(""); // 로그인 실패 시 에러 메시지를 저장할 state

	// 로그인 버튼 클릭 시 실행되는 함수
	const handleSubmit = async (e) => {
		e.preventDefault(); // 기본 폼 제출 동작(페이지 새로고침) 방지
		setError(""); // 에러 메시지 초기화

		try {
			// 백엔드 API로 로그인 요청을 보냄
			const response = await axios.post("http://localhost:8000/api/login", {
				email,      // 사용자가 입력한 이메일
				password,   // 사용자가 입력한 비밀번호
			});

			console.log("로그인 성공:", response.data); // 성공 시 응답 데이터 출력
		} catch (error) {
			setError("로그인 실패: 아이디 또는 비밀번호가 올바르지 않습니다.");
			console.error("로그인 실패", error);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center h-screen bg-white">
			<h2 className="text-3xl font-bold mb-6">환영합니다.</h2>

			<form onSubmit={handleSubmit} className="w-80">
				<input
					type="email"
					placeholder="이메일 주소"
					className="w-full px-4 py-3 border rounded-lg text-gray-500 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>

				<input
					type="password"
					placeholder="비밀번호"
					className="w-full px-4 py-3 border rounded-lg text-gray-500 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>

				<button
					type="submit"
					className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600"
				>
					로그인
				</button>

				{error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}

				<p className="text-center text-gray-500 mt-4">
					계정이 없으신가요? <a href="#" className="text-blue-500">회원가입</a>
				</p>
			</form>

			<div className="w-80 border-b border-gray-300 my-4"></div>

			<button className="w-80 bg-yellow-400 text-black py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-yellow-500">
				<span className="text-xl">💬</span> 카카오 로그인
			</button>

			<div className="mt-6 text-sm text-gray-500 flex gap-2">
				<a href="#" className="hover:underline">이용약관</a> |
				<a href="#" className="hover:underline">개인정보 보호 정책</a>
			</div>
		</div>
	);
};

export default Login;
