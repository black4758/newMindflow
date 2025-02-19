import React from "react";

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#353a3e] py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-center text-white mb-8">마인드플로우란?</h1>
      <p className="text-center text-lg text-white mb-12">
        마인드맵은 아이디어를 시각적으로 정리하는 도구입니다. 다양한 요소를 추가하여 팀과의 협업을 쉽게 할 수 있습니다.
      </p>
      <button className="bg-blue-500 text-white px-4 py-2 rounded mb-12 hover:bg-blue-400 transition">
        <a href="/login/" className="bg-blue-500 text-white">
            로그인 하러 가기
        </a>
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">마인드맵을 사용하는 이유는 무엇인가요?</h2>
          <p className="text-gray-700 mb-4">
            마인드맵은 복잡한 아이디어를 시각적으로 정리하는 데 유용합니다. 이를 통해 생각을 명확히 하고, 창의적인 해결책을 찾을 수 있습니다.
          </p>
          <img src="image1.png" alt="마인드맵 예시" className="w-full h-48 object-cover rounded" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">마인드맵으로 아이디어 정리</h2>
          <p className="text-gray-700 mb-4">
            마인드맵을 사용하여 아이디어를 체계적으로 정리하고, 팀원들과 쉽게 공유할 수 있습니다.
          </p>
          <img src="image2.png" alt="아이디어 정리" className="w-full h-48 object-cover rounded" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">디자인 요소 마인드맵에 넣기</h2>
          <p className="text-gray-700 mb-4">
            다양한 디자인 요소를 추가하여 마인드맵을 더욱 풍부하게 만들 수 있습니다.
          </p>
          <img src="image3.png" alt="디자인 요소" className="w-full h-48 object-cover rounded" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">팀 공동 작업</h2>
          <p className="text-gray-700 mb-4">
            팀원들과의 협업을 통해 더 나은 결과를 도출할 수 있습니다.
          </p>
          <img src="image4.png" alt="팀 작업" className="w-full h-48 object-cover rounded" />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;