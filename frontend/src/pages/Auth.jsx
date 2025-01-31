import React, { useState } from "react";
import axios from "axios";

function Login() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	// const [token, setToken] = useState(null);

	const handleLogin = async () => {
		try {
			const response = await axios.post("http://localhost:5173", {
				username,
				password
			});
			// setToken(response.data.token);
			// localStorage.setItem("token", response.data.token);
			console.log(username, password)
			console.log("전송 성공")
		} catch(error) {
			console.error("로그인 실패");
		}
	};

	return (
		<div>
			<input type="text" placeholder="아이디" onChange={(e) => setUsername(e.target.value)} />
			<input type="password" placeholder="비밀번호" onChange={(e) => setPassword(e.target.value)} />
			<button onClick={handleLogin}>로그인</button>
		</div>
	);
}

export default Login;