import React from "react"
import { useParams, useLocation } from "react-router-dom"
import Mindmaplist from "../components/feature/Mindmaplist"
import Mindmap from "../components/feature/Mindmap"

const MindmapPage = () => {
  const { chatRoomId } = useParams();
  const location = useLocation();
  const graphData = location.state?.graphData;

  return (
    <div className="w-full h-full relative">
      {chatRoomId ? (
        <Mindmap 
          initialData={graphData} 
          chatRoomId={chatRoomId}
        />
      ) : (
        <Mindmaplist />
      )}
    </div>
  )
}

export default MindmapPage
