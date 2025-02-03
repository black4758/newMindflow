import React from "react";
import { useNavigate } from "react-router-dom";

const SearchComponent = ({
  searchTerm,
  setSearchTerm,
  searchResults,
  setSearchResults,
  isDetailView = false,
  onNodeSelect
}) => {
  const navigate = useNavigate();

  return (
    <div className="absolute left-4 top-4 z-50">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="노드 검색..."
          className="w-64 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {isDetailView && (
          <button
            className="ml-2 px-4 py-2 bg-gray-200 rounded-lg"
            onClick={() => navigate('/mindmap')}
          >
            뒤로 가기
          </button>
        )}

        {/* 검색 결과 드롭다운 */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
            {searchResults.map((node) => (
              <div
                key={node.id}
                onClick={() => onNodeSelect && onNodeSelect(node)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <div className="font-medium">{node.title}</div>
                <div className="text-sm text-gray-600 truncate">{node.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchComponent; 