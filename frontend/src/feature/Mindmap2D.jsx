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

const Mindmap2D = ({ searchTerm, searchResults, setSearchResults }) => {
  const graphRef = useRef()
  const navigate = useNavigate()
  const [highlightNodes, setHighlightNodes] = useState(new Set())
  const [highlightLinks, setHighlightLinks] = useState(new Set())
  const [hoverNode, setHoverNode] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [isNodeFocused, setIsNodeFocused] = useState(false)

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

    const filteredNodes = processedData.nodes.filter((node) => node.title.toLowerCase().includes(searchTerm.toLowerCase()) || node.content.toLowerCase().includes(searchTerm.toLowerCase()))
    setSearchResults(filteredNodes)
  }, [searchTerm, processedData.nodes, setSearchResults])

  // 노드 선택 시 해당 노드로 카메라 이동
  const handleNodeSelect = useCallback((node) => {
    setSelectedNode(node)
    graphRef.current.centerAt(node.x, node.y, 1000)
    graphRef.current.zoom(2, 1000)
  }, [])

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

  // 노드 클릭/선택 핸들러
  const handleNodeFocus = useCallback((node) => {
    if (isNodeFocused && selectedNode?.id === node.id) {
      const connectedNodes = new Set();
      connectedNodes.add(node.id);
      
      testdata.relationships.forEach(rel => {
        if (rel.source === node.id) connectedNodes.add(rel.target);
        if (rel.target === node.id) connectedNodes.add(rel.source);
      });

      const filteredData = {
        nodes: testdata.nodes.filter(n => connectedNodes.has(n.id)),
        relationships: testdata.relationships.filter(rel => 
          connectedNodes.has(rel.source) && connectedNodes.has(rel.target)
        )
      };

      navigate('/mindmap/detail/', { 
        state: { graphData: filteredData },
        replace: true
      });
    } else {
      setIsNodeFocused(true);
      setSelectedNode(node);
      handleNodeSelect(node);
    }
  }, [isNodeFocused, selectedNode, handleNodeSelect, navigate]);

  return (
    <ForceGraph2D
      ref={graphRef}
      graphData={processedData}
      width={window.innerWidth - 256}
      height={window.innerHeight - 64}
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

export default Mindmap2D
