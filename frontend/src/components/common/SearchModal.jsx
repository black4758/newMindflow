import { createPortal } from "react-dom"
import { X } from "lucide-react"

const SearchModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null

  return createPortal(
    <>
      {/* 반투명 오버레이 - 클릭시 모달 닫기 */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
        <div className="bg-gray-100 rounded-lg w-full max-w-2xl mx-auto pointer-events-auto">
          {/* 모달 헤드 */}

          <div className="flex justify-between items-center p-4 border-b">
            <input type="text" placeholder="검색 입력..." className="w-full p-2 rounded-md" />

            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-2 p-2 text-black" />
            </button>
          </div>
          {/*	모달 content*/}
          <div className="p-4">{children}</div>
        </div>
      </div>
    </>,
    document.getElementById("modal-root")
  )
}

export default SearchModal
