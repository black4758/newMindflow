import React, { useRef, useEffect, useState, useCallback, useMemo } from "react"
import { ForceGraph2D } from "react-force-graph"
import ForceGraph3D from "react-force-graph-3d"
import SpriteText from "three-spritetext"
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer"
// import testdata from "../store/mindmap/testdata.json"
import testdata from './testdata.json';
import PropTypes from "prop-types"
import { useNavigate } from "react-router-dom"

const extraRenderers = [new CSS2DRenderer()]

// 모드 상태를 저장하기 위한 전역 변수나 localStorage 사용
const setViewMode = (is3D) => {
  localStorage.setItem('viewMode', is3D ? '3d' : '2d');
};

const getViewMode = () => {
  return localStorage.getItem('viewMode') === '3d';
};

const Mindmap = () => {
  const [is3D, setIs3D] = useState(getViewMode())
  const graphRef = useRef()
  const navigate = useNavigate()
  const [highlightNodes, setHighlightNodes] = useState(new Set())
  const [highlightLinks, setHighlightLinks] = useState(new Set())
  const [hoverNode, setHoverNode] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [isNodeFocused, setIsNodeFocused] = useState(false)

  // is3D 상태가 변경될 때마다 저장
  useEffect(() => {
    setViewMode(is3D);
  }, [is3D]);

  const processedData = useMemo(() => {
    // 노드의 깊이(depth) 계산 함수
    const calculateDepth = (nodeId, visited = new Set()) => {
      if (visited.has(nodeId)) return 0;
      visited.add(nodeId);
      
      const relationships = testdata.relationships.filter(rel => rel.source === nodeId);
      if (relationships.length === 0) return 0;
      
      const childDepths = relationships.map(rel => calculateDepth(rel.target, visited));
      return 1 + Math.max(...childDepths);
    };

    // 노드의 레벨(level) 계산 함수
    const calculateLevel = (nodeId, parentId = null, level = 0, visited = new Set()) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = testdata.nodes.find(n => n.id === nodeId);
      if (node) {
        node.level = level;
      }

      const children = testdata.relationships
        .filter(rel => rel.source === nodeId)
        .map(rel => rel.target);

      children.forEach(childId => {
        calculateLevel(childId, nodeId, level + 1, visited);
      });
    };

    // 루트 노드 찾기
    const rootNodes = testdata.nodes
      .filter(node => !testdata.relationships.some(rel => rel.target === node.id))
      .map(node => node.id);

    rootNodes.forEach(rootId => calculateLevel(rootId));

    // 색상 배열 정의
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    const nodes = testdata.nodes.map(node => ({
      ...node,
      color: colors[node.level % colors.length]
    }));

    const links = testdata.relationships.map(rel => ({
      source: rel.source,
      target: rel.target,
      type: rel.type
    }));

    // cross-link node objects
    links.forEach(link => {
      const a = nodes.find(node => node.id === link.source);
      const b = nodes.find(node => node.id === link.target);
      
      !a.neighbors && (a.neighbors = []);
      !b.neighbors && (b.neighbors = []);
      a.neighbors.push(b);
      b.neighbors.push(a);

      !a.links && (a.links = []);
      !b.links && (b.links = []);
      a.links.push(link);
      b.links.push(link);
    });

    return { nodes, links };
  }, []);

  // updateHighlight를 useCallback으로 감싸고 의존성 추가
  const updateHighlight = useCallback(() => {
    if (!hoverNode) {
      setHighlightNodes(new Set())
      setHighlightLinks(new Set())
      return
    }

    const connectedNodes = processedData.links.filter((link) => link.source === hoverNode || link.target === hoverNode).map((link) => (link.source === hoverNode ? link.target : link.source))

    setHighlightNodes(new Set([hoverNode, ...connectedNodes]))
    setHighlightLinks(new Set(processedData.links.filter((link) => link.source === hoverNode || link.target === hoverNode)))
  }, [hoverNode, processedData.links])

  // useEffect의 의존성 배열 수정
  useEffect(() => {
    updateHighlight()
  }, [updateHighlight])

  // useEffect 수정
  useEffect(() => {
    if (graphRef.current) {
      if (is3D) {
        // 3D 모드: 집중형 배치
        graphRef.current.d3Force("charge").strength(-30);  // 반발력 감소
        graphRef.current.d3Force("link").distance(50);     // 링크 길이 감소
      } else {
        // 2D 모드: 확산형 배치
        graphRef.current.d3Force("charge").strength(-200); // 반발력 증가
        graphRef.current.d3Force("link").distance(200);    // 링크 길이 증가
      }
    }
    
  }, [is3D]); // is3D가 변경될 때마다 실행

  // 검색어에 따른 결과 필터링
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([])
      return
    }

    const filteredNodes = processedData.nodes.filter((node) => node.title.toLowerCase().includes(searchTerm.toLowerCase()) || node.content.toLowerCase().includes(searchTerm.toLowerCase()))
    setSearchResults(filteredNodes)
  }, [searchTerm, processedData.nodes])

  // 노드 선택 시 해당 노드로 카메라 이동하는 함수
  const handleNodeSelect = useCallback((node) => {
    // 선택된 노드 상태 업데이트
    setSelectedNode(node);
    // 검색창 초기화
    setSearchTerm("");
    setSearchResults([]);

    // 그래프 참조가 존재할 경우에만 카메라 이동 실행
    if (graphRef.current) {
      if (is3D) {
        // 3D 모드에서의 카메라 이동
        const distance = 40; // 카메라와 노드 사이의 거리
        // distRatio: 카메라 위치를 조절하기 위한 비율 계산
        const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
        
        // 카메라를 선택된 노드 주변으로 부드럽게 이동
        graphRef.current.cameraPosition(
          // 목표 카메라 위치 설정
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
          // 카메라가 바라볼 노드
          node,
          // 애니메이션 시간 (밀리초)
          2000
        );
      } else {
        // 2D 모드에서의 카메라 이동
        // centerAt: 선택된 노드를 화면 중앙으로 이동 (x좌표, y좌표, 애니메이션 시간)
        graphRef.current.centerAt(node.x, node.y, 1000);
        // zoom: 선택된 노드를 확대 (확대 레벨, 애니메이션 시간)
        graphRef.current.zoom(2, 1000);
      }
    }
  }, [is3D]); // is3D 상태가 변경될 때마다 함수 재생성

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

    return processedData.nodes.reduce((sizes, node) => {
      sizes[node.id] = getNodeSize(node.title, context, fontSize)
      return sizes
    }, {})
  }, [processedData.nodes])

  // 노드 클릭/선택 핸들러 수정
  const handleNodeFocus = useCallback((node) => {
    // 이미 선택된 노드를 다시 클릭했을 때만 Onedata로 이동
    if (isNodeFocused && selectedNode?.id === node.id) {
      const connectedNodes = new Set();
      connectedNodes.add(node.id);
      
      // 연결된 노드들 찾기
      testdata.relationships.forEach(rel => {
        if (rel.source === node.id) connectedNodes.add(rel.target);
        if (rel.target === node.id) connectedNodes.add(rel.source);
      });

      // 필터링된 데이터 생성
      const filteredData = {
        nodes: testdata.nodes.filter(n => connectedNodes.has(n.id)),
        relationships: testdata.relationships.filter(rel => 
          connectedNodes.has(rel.source) && connectedNodes.has(rel.target)
        )
      };

      // state와 함께 navigate 호출
      navigate('/mindmap/detail/', { 
        state: { graphData: filteredData },
        replace: true  // 현재 경로를 대체
      });
    } else {
      setIsNodeFocused(true);
      setSelectedNode(node);
      handleNodeSelect(node);
    }
  }, [isNodeFocused, selectedNode, handleNodeSelect, navigate]);

  return (
    <div className="relative w-full h-full">
      {/* 검색창 컨테이너 - 절대 위치로 좌측 상단에 배치 */}
      <div className="absolute left-4 top-4 z-50">
        <div className="relative">
          {/* 검색 입력창 */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="노드 검색..."
            className="w-64 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* 검색 결과 드롭다운 - 검색 결과가 있을 때만 표시 */}
          {searchResults.length > 0 && (
            <div 
              className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
              // onMouseDown 이벤트의 기본 동작을 막아 input blur 이벤트보다 클릭 이벤트가 먼저 발생하도록 함
              // onMouseDown={(e) => e.preventDefault()}
            >
              {/* 검색 결과 목록을 map으로 순회하며 표시 */}
              {searchResults.map((node) => (
                <div 
                  key={node.id} 
                  // 노드 클릭 시 해당 노드로 이동하는 핸들러 연결
                  onClick={() => handleNodeSelect(node)} 
                  // hover 효과가 있는 커서 스타일 지정
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {/* 노드 제목 표시 */}
                  <div className="font-medium">{node.title}</div>
                  {/* 노드 내용을 한 줄로 잘라서 표시 */}
                  <div className="text-sm text-gray-600 truncate">{node.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2D/3D 전환 버튼 */}
      <button
        className="absolute bottom-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg"
        onClick={() => setIs3D(!is3D)}
      >
        {is3D ? '2D로 보기' : '3D로 보기'}
      </button>

      {/* 조건부 렌더링으로 2D/3D 그래프 전환 */}
      {is3D ? (
        <ForceGraph3D
          ref={graphRef}
          graphData={processedData}
          nodeThreeObject={node => {
            const sprite = new SpriteText(node.title)
            sprite.color = node.color
            sprite.textHeight = 8
            return sprite
          }}
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
          d3ForceStrength={-30}  // 집중형 배치를 위한 약한 반발력
          linkDistance={50}      // 짧은 링크 거리
          nodeLabel={(node) => ""}
          backgroundColor="#fbfbfb"
          nodePointerAreaPaint={(node, color, ctx) => {
            const fontSize = 12
            const { width, height } = getNodeSize(node.title, ctx, fontSize)

            // 호버 영역을 노드의 실제 크기로 설정
            ctx.fillStyle = color
            ctx.fillRect(node.x - width / 2, node.y - height / 2, width, height)
          }}
          onNodeClick={handleNodeFocus}
        />
      ) : (
        <ForceGraph2D
          ref={graphRef}
          graphData={processedData}
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
          d3ForceStrength={-200} // 확산형 배치를 위한 강한 반발력
          linkDistance={200}     // 긴 링크 거리
          nodeLabel={(node) => ""}
          backgroundColor="#fbfbfb"
          nodePointerAreaPaint={(node, color, ctx) => {
            const fontSize = 12
            const { width, height } = getNodeSize(node.title, ctx, fontSize)

            // 호버 영역을 노드의 실제 크기로 설정
            ctx.fillStyle = color
            ctx.fillRect(node.x - width / 2, node.y - height / 2, width, height)
          }}
          onNodeClick={handleNodeFocus}
        />
      )}

      {/* 호버 시 보여줄 상세 정보 팝업 */}
      {hoverNode && (
        <div
          className="fixed bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-xs"
          style={{
            right: '2rem', // right: 4와 동일
            bottom: '4rem', // bottom: 4 + 버튼 높이 + 여백
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
