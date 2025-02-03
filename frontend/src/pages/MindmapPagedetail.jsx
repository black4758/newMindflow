import React, { useState } from "react";
import Mindmap2Ddetail from "../feature/Mindmap2Ddetail";
import Mindmap3Ddetail from "../feature/Mindmap3Ddetail";
import SearchComponent from "../components/SearchComponent";
import { useLocation } from "react-router-dom";

const MindmapPagedetail = () => {
  const [is3D, setIs3D] = useState(localStorage.getItem('viewMode') === '3d');
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const location = useLocation();
  const graphData = location.state?.graphData;

  const handleViewModeChange = () => {
    const newMode = !is3D;
    localStorage.setItem('viewMode', newMode ? '3d' : '2d');
    setIs3D(newMode);
  };

  return (
    <div className="w-full h-full relative">
      {/* 검색 컴포넌트 */}
      <SearchComponent
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        isDetailView={true}
      />

      {/* 2D/3D 전환 버튼 */}
      <button
        className="absolute bottom-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg"
        onClick={handleViewModeChange}
      >
        {is3D ? '2D로 보기' : '3D로 보기'}
      </button>

      {/* 조건부 렌더링으로 2D/3D 그래프 전환 */}
      {is3D ? (
        <Mindmap3Ddetail
          graphData={graphData}
          searchTerm={searchTerm}
          searchResults={searchResults}
          setSearchResults={setSearchResults}
        />
      ) : (
        <Mindmap2Ddetail
          graphData={graphData}
          searchTerm={searchTerm}
          searchResults={searchResults}
          setSearchResults={setSearchResults}
        />
      )}
    </div>
  );
};

export default MindmapPagedetail; 