import { useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import PropTypes from "prop-types"
// import axios from 'axios';

const SearchModal = ({ isOpen, onClose }) => {
  const [searchInput, setSearchInput] = useState("")
  const [SearchResults, setSearchResults] = useState([])

  // const handleSearch = async (input) => {

  // 더미 데이터
  const handleSearch = (input) => {
    const dummyData = ["커널은 맛있다", "커널은 즐겁다", "커널은 괴롭다", "커널은 분노한다"]

    const results = dummyData.filter((item) => item.includes(input))
    setSearchResults(results)

    // API 연동
    // if (input.trin() === "") {
    //   setSearchResults([]);
    //   return;
    // }

    // try {
    //   const response = await axios.get(`api_url?query=${input}`);
    //   const results = response.data;
    //   setSearchResults(results);
    // } catch (error) {
    //   console.error("검색 오류:", error);
    // }
  }

  const handleInputChange = (e) => {
    const input = e.target.value
    setSearchInput(input)
    if (input.trim() === "") {
      setSearchResults([])
    } else {
      handleSearch(input)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <>
      {/* 반투명 오버레이 - 클릭시 모달 닫기 */}
      <div className="absolute inset-0 z-40" onClick={onClose} />

      {/* 모달 컨테이너 */}
      <div className="absolute inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
        <div className="bg-gray-100 rounded-lg w-full max-w-2xl mx-auto pointer-events-auto flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <input type="text" value={searchInput} onChange={handleInputChange} placeholder="검색 입력..." className="w-full p-2 rounded-md" />
            <button onClick={onClose} className="p-1 hover:bg-gray-400 rounded-full">
              <X className="w-2 p-2 text-black" />
            </button>
          </div>
          <div className="p-4">
            {SearchResults.map((result, index) => (
              <button
                key={index}
                className="block 
        w-full 
        text-left 
        p-2 
        mb-2 
        bg-gray-800 
        text-white 
        rounded-full 
        hover:bg-gray-700 
        transition-all 
        duration-300 
        shadow-md
        hover:shadow-neon
        animate-neon-shine"
              >
                {result}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.getElementById("modal-root")
  )
}

SearchModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default SearchModal
