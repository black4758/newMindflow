import { useRef, useEffect, useState, useCallback, useMemo } from "react"
import { ForceGraph2D } from "react-force-graph"
import testdata from "../../store/mindmap/testdata.json"
import PropTypes from "prop-types"

const Mindmap = () => {
  const graphRef = useRef()
  const [highlightNodes, setHighlightNodes] = useState(new Set())
  const [highlightLinks, setHighlightLinks] = useState(new Set())
  const [hoverNode, setHoverNode] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [graphData, setGraphData] = useState(() => {
    // 노드 맵 생성 (id로 노드를 빠르게 찾기 위함)
    const nodesById = {}
    const nodes = testdata.nodes.map((item) => {
      const node = {
        id: item.id,
        title: item.title,
        content: item.content,
        color: "#4299e1",
        size: 6,
      }
      nodesById[node.id] = node
      return node
    })

    // 링크 생성 (실제 노드 객체 참조)
    const links = testdata.relationships.map((item) => ({
      source: nodesById[item.source],
      target: nodesById[item.target],
      color: "#e2e8f0",
      width: 1,
    }))

    return { nodes, links }
  })

  // updateHighlight를 useCallback으로 감싸고 의존성 추가
  const updateHighlight = useCallback(() => {
    if (!hoverNode) {
      setHighlightNodes(new Set())
      setHighlightLinks(new Set())
      return
    }

    const connectedNodes = graphData.links.filter((link) => link.source === hoverNode || link.target === hoverNode).map((link) => (link.source === hoverNode ? link.target : link.source))

    setHighlightNodes(new Set([hoverNode, ...connectedNodes]))
    setHighlightLinks(new Set(graphData.links.filter((link) => link.source === hoverNode || link.target === hoverNode)))
  }, [hoverNode, graphData.links])

  // useEffect의 의존성 배열 수정
  useEffect(() => {
    updateHighlight()
  }, [updateHighlight])

  useEffect(() => {
    if (graphRef.current) {
      // 반발력을 설정하여 노드들이 더 멀리 퍼지도록 함
      graphRef.current.d3Force("charge").strength(-100)

      // 링크 길이를 조정하는 force 추가
      graphRef.current.d3Force("link").distance(200)
    }
  }, [])

  // 검색어에 따른 결과 필터링
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([])
      return
    }

    const filteredNodes = graphData.nodes.filter((node) => node.title.toLowerCase().includes(searchTerm.toLowerCase()) || node.content.toLowerCase().includes(searchTerm.toLowerCase()))
    setSearchResults(filteredNodes)
  }, [searchTerm, graphData.nodes])

  // 노드 선택 시 해당 노드로 카메라 이동
  const handleNodeSelect = (node) => {
    setSelectedNode(node)
    setSearchTerm("")
    setSearchResults([])

    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000)
      graphRef.current.zoom(2, 1000)
    }
  }

  // 노드 크기를 텍스트 길이에 따라 동적으로 계산
  const getNodeSize = (text, ctx, fontSize) => {
    ctx.font = `${fontSize}px Sans-Serif`
    const textWidth = ctx.measureText(text || "").width
    const padding = 16 // 텍스트 좌우 패딩
    return {
      width: textWidth + padding,
      height: fontSize + padding / 2, // 텍스트 높이 + 상하 패딩
    }
  }

  // 노드 크기 캐시
  const nodeSizes = useMemo(() => {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    const fontSize = 12

    return graphData.nodes.reduce((sizes, node) => {
      sizes[node.id] = getNodeSize(node.title, context, fontSize)
      return sizes
    }, {})
  }, [graphData.nodes])

  return (
    <div className="relative w-full h-full">
      {/* 검색창 */}
      <div className="absolute left-4 top-4 z-50">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="노드 검색..."
            className="w-64 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* 검색 결과 드롭다운 */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
              {searchResults.map((node) => (
                <div key={node.id} onClick={() => handleNodeSelect(node)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <div className="font-medium">{node.title}</div>
                  <div className="text-sm text-gray-600 truncate">{node.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={window.innerWidth - 256}
        height={window.innerHeight - 64}
        nodeRelSize={1}
        nodeVal={1}
        nodeColor={(node) => "#4299e1"}
        nodeOpacity={1}
        nodeCanvasObjectMode={() => "replace"}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const fontSize = 12
          const { width, height } = getNodeSize(node.title, ctx, fontSize)
          const isHighlighted = highlightNodes.has(node)
          const radius = 8

          // 노드를 텍스트 박스로 그리기
          ctx.save()

          // 텍스트 박스 그리기
          ctx.beginPath()
          ctx.moveTo(node.x - width / 2 + radius, node.y - height / 2)
          ctx.lineTo(node.x + width / 2 - radius, node.y - height / 2)
          ctx.quadraticCurveTo(node.x + width / 2, node.y - height / 2, node.x + width / 2, node.y - height / 2 + radius)
          ctx.lineTo(node.x + width / 2, node.y + height / 2 - radius)
          ctx.quadraticCurveTo(node.x + width / 2, node.y + height / 2, node.x + width / 2 - radius, node.y + height / 2)
          ctx.lineTo(node.x - width / 2 + radius, node.y + height / 2)
          ctx.quadraticCurveTo(node.x - width / 2, node.y + height / 2, node.x - width / 2, node.y + height / 2 - radius)
          ctx.lineTo(node.x - width / 2, node.y - height / 2 + radius)
          ctx.quadraticCurveTo(node.x - width / 2, node.y - height / 2, node.x - width / 2 + radius, node.y - height / 2)
          ctx.closePath()

          // 배경색 설정
          ctx.fillStyle = isHighlighted ? "#4299e1" : "rgba(66, 153, 225, 0.2)"
          ctx.fill()

          // 테두리 설정
          if (isHighlighted) {
            ctx.strokeStyle = node === hoverNode ? "#ef4444" : "#f59e0b"
            ctx.lineWidth = 2
            ctx.stroke()
          }

          // 텍스트 설정
          ctx.font = `${fontSize}px Sans-Serif`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillStyle = isHighlighted ? "#ffffff" : "#1a365d"
          ctx.fillText(node.title, node.x, node.y)

          ctx.restore()

          // 노드의 실제 크기 설정 (충돌 감지 및 호버링에 사용)
          node.size = Math.max(width, height)
          node.width = width
          node.height = height
        }}
        linkWidth={1}
        linkColor={(link) => (highlightLinks.has(link) ? "#94a3b8" : "rgba(226, 232, 240, 0.2)")}
        linkDirectionalParticles={4}
        linkDirectionalParticleWidth={(link) => (highlightLinks.has(link) ? 2 : 0)}
        linkDirectionalParticleSpeed={0.005}
        onNodeHover={(node) => {
          setHoverNode(node)
          if (node) {
            // 호버 시 커서 변경
            document.body.style.cursor = "pointer"
          } else {
            document.body.style.cursor = "default"
          }
        }}
        onNodeDragEnd={(node) => {
          node.fx = node.x
          node.fy = node.y
        }}
        d3Force="charge"
        d3ForceStrength={-100}
        linkDistance={200}
        nodeLabel={(node) => ""}
        backgroundColor="#ffffff"
        nodePointerAreaPaint={(node, color, ctx) => {
          const fontSize = 12
          const { width, height } = getNodeSize(node.title, ctx, fontSize)

          // 호버 영역을 노드의 실제 크기로 설정
          ctx.fillStyle = color
          ctx.fillRect(node.x - width / 2, node.y - height / 2, width, height)
        }}
      />

      {/* 호버 시 보여줄 상세 정보 팝업 */}
      {hoverNode && (
        <div
          className="fixed bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-xs"
          style={{
            left: `${hoverNode.x + (window.innerWidth - 256) / 2}px`,
            top: `${hoverNode.y + (window.innerHeight - 64) / 2 - hoverNode.height - 60}px`, // 노드 높이만큼 위로 + 여백
            transform: "translateX(-50%)", // 가운데 정렬
            zIndex: 1000,
          }}
        >
          <h3 className="font-bold text-lg mb-2">{hoverNode.title}</h3>
          <p className="text-gray-600">{hoverNode.content}</p>
        </div>
      )}
    </div>
  )
}

const CustomNodeComponent = ({ data }) => {
  return (
    <div className="min-w-[150px] p-2">
      <div className="font-bold text-gray-800 mb-1">{data.label}</div>
      {data.description && <div className="text-sm text-gray-600">{data.description}</div>}
      {data.tags && (
        <div className="flex flex-wrap gap-1 mt-2">
          {data.tags.map((tag, index) => (
            <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

CustomNodeComponent.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
}

export default Mindmap
