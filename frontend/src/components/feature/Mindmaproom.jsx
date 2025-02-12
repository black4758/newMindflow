import React, { useRef, useEffect, useState, useCallback, useMemo } from "react"
import { ForceGraph2D } from "react-force-graph"
import ForceGraph3D from "react-force-graph-3d"
import SpriteText from "three-spritetext"
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer"
import { fetchMindmapData, deleteNode } from '../../api/mindmap'
import PropTypes from "prop-types"
import { useNavigate, useLocation, useParams } from "react-router-dom"
import * as d3 from "d3"


const extraRenderers = [new CSS2DRenderer()]

// 모드 상태를 저장하기 위한 전역 변수나 localStorage 사용
const setViewMode = (is3D) => {
  localStorage.setItem('viewMode', is3D ? '3d' : '2d');
};

const getViewMode = () => {
  return localStorage.getItem('viewMode') === '3d';
};

const Mindmaproom = ({ data, onDataUpdate }) => {
  const { chatRoomId } = useParams();
  const navigate = useNavigate();
  const [is3D, setIs3D] = useState(getViewMode())
  const graphRef = useRef()
  const location = useLocation()
  const [highlightNodes, setHighlightNodes] = useState(new Set())
  const [highlightLinks, setHighlightLinks] = useState(new Set())
  const [hoverNode, setHoverNode] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [isNodeFocused, setIsNodeFocused] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const [hoverLegend, setHoverLegend] = useState(false)
  const [localData, setLocalData] = useState(data);
  const [lastClickedNode, setLastClickedNode] = useState(null);
  const [doubleClickTimerRef] = useState(useRef(null));
  const [fixedNode, setFixedNode] = useState(null);
  const [fixedPosition, setFixedPosition] = useState({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoverTimeoutRef] = useState(useRef(null));
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [selectedNodeForEdit, setSelectedNodeForEdit] = useState(null);

  // is3D 상태가 변경될 때마다 저장
  useEffect(() => {
    setViewMode(is3D);
  }, [is3D]);

  // 데이터가 변경될 때 localData 업데이트
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // 현재 chatRoomId에 해당하는 데이터만 필터링
  const processedData = useMemo(() => {
    // localData를 사용하도록 변경
    const filteredNodes = localData.nodes.filter(node => 
      node.chatRoomId === chatRoomId
    );

    // 필터링된 노드들의 ID Set 생성
    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));

    // 필터링된 노드들 간의 관계만 추출
    const filteredRelationships = localData.relationships.filter(rel =>
      filteredNodeIds.has(rel.source) && filteredNodeIds.has(rel.target)
    );

    // 노드의 깊이(depth) 계산 함수
    const calculateDepth = (nodeId, visited = new Set()) => {
      if (visited.has(nodeId)) return 0;
      visited.add(nodeId);

      const relationships = localData.relationships.filter(rel => rel.source === nodeId);
      if (relationships.length === 0) return 0;

      const childDepths = relationships.map(rel => calculateDepth(rel.target, visited));
      return 1 + Math.max(...childDepths);
    };

    // 노드의 레벨(level) 계산 함수
    const calculateLevel = (nodeId, parentId = null, level = 0, visited = new Set()) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = localData.nodes.find(n => n.id === nodeId);
      if (node) {
        node.level = level;
      }

      const children = localData.relationships
        .filter(rel => rel.source === nodeId)
        .map(rel => rel.target);

      children.forEach(childId => {
        calculateLevel(childId, nodeId, level + 1, visited);
      });
    };

    // 루트 노드 찾기 (필터링된 노드들 중에서)
    const rootNodes = filteredNodes
      .filter(node => !filteredRelationships.some(rel => rel.target === node.id))
      .map(node => node.id);

    rootNodes.forEach(rootId => calculateLevel(rootId));

    // 색상 배열 정의
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const rootColor = '#FF6B6B';

    const nodes = filteredNodes.map(node => {
      const isRoot = !filteredRelationships.some(rel => rel.target === node.id);
      return {
        ...node,
        color: isRoot ? rootColor : colors[node.level % colors.length],
        isRoot
      }
    });

    const links = filteredRelationships.map(rel => ({
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
  }, [localData, chatRoomId]);

  // 루트 노드까지의 경로를 찾는 함수 추가
  // findPathToRoot 함수 수정 (mindmapdata를 의존성으로 추가)
  const findPathToRoot = useCallback((nodeId, visited = new Set()) => {
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);

    // 현재 노드가 루트 노드인지 확인
    const isRoot = !localData.relationships.some(rel => rel.target === nodeId);
    if (isRoot) return [nodeId];

    // 부모 노드들 찾기
    const parentRels = localData.relationships.filter(rel => rel.target === nodeId);
    
    for (const rel of parentRels) {
      const path = findPathToRoot(rel.source, visited);
      if (path) {
        return [...path, nodeId];
      }
    }
    
    return null;
  }, [localData.relationships]);  // mindmapdata.relationships 의존성 추가

  // updateHighlight 함수 수정
  const updateHighlight = useCallback(() => {
    if (!hoverNode) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      // 모든 노드의 속성 초기화
      processedData.nodes.forEach(node => {
        node.isPathNode = false;
        node.relationType = null; // 관계 타입 초기화 추가
      });
      // 모든 링크의 속성 초기화
      processedData.links.forEach(link => {
        link.isPathLink = false;
      });
      return;
    }

    // 하이라이트 시작 전에 모든 노드와 링크의 속성 초기화
    processedData.nodes.forEach(node => {
      node.isPathNode = false;
      node.relationType = null;
    });
    processedData.links.forEach(link => {
      link.isPathLink = false;
    });

    // 연결된 노드들과 관계 타입 찾기
    const connectedNodesWithTypes = processedData.links
      .filter(link => link.source === hoverNode || link.target === hoverNode)
      .map(link => {
        const connectedNode = link.source === hoverNode ? link.target : link.source;
        return {
          node: connectedNode,
          type: link.type,
          isSource: link.source === hoverNode
        };
      });

    // 루트까지의 경로 찾기
    const path = findPathToRoot(hoverNode.id);
    
    // 모든 하이라이트할 노드들을 하나의 Set으로 합치기
    const highlightedNodes = new Set([hoverNode]);
    const highlightedLinks = new Set();

    // 연결된 노드들의 관계 타입 설정
    connectedNodesWithTypes.forEach(({ node, type, isSource }) => {
      highlightedNodes.add(node);
      node.relationType = type; // 관계 타입 저장
      
      // 해당 링크 찾기
      const link = processedData.links.find(l => 
        (l.source === hoverNode && l.target === node) ||
        (l.source === node && l.target === hoverNode)
      );
      if (link) {
        highlightedLinks.add(link);
      }
    });

    // 루트까지의 경로를 별도로 저장
    if (path) {
      path.forEach(nodeId => {
        const node = processedData.nodes.find(n => n.id === nodeId);
        if (node) {
          node.isPathNode = true;
          highlightedNodes.add(node);
        }
      });
      
      processedData.links.forEach(link => {
        if (path.includes(link.source.id || link.source) && 
            path.includes(link.target.id || link.target)) {
          link.isPathLink = true;
          highlightedLinks.add(link);
        }
      });
    }

    setHighlightNodes(highlightedNodes);
    setHighlightLinks(highlightedLinks);
  }, [hoverNode, processedData.links, processedData.nodes, findPathToRoot]);

  // useEffect의 의존성 배열 수정
  useEffect(() => {
    updateHighlight()
  }, [updateHighlight])

  // 마우스 위치 추적을 위한 상태 추가
  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // useEffect 수정: 시뮬레이션 설정 업데이트
  useEffect(() => {
    if (graphRef.current) {
      if (is3D) {
        // 3D 모드: 집중형 배치
        graphRef.current.d3Force("charge").strength(-60);  // 반발력 유지
        graphRef.current.d3Force("link").distance(100);    // 링크 길이 2배로 증가 (50 -> 100)
      } else {
        // 2D 모드: 확산형 배치
        graphRef.current.d3Force("charge").strength(-800);
        graphRef.current.d3Force("link").distance(200);    
        
        graphRef.current.d3Force("repulsion", d3.forceManyBody().strength((node) => {
          const hasLinks = processedData.links.some(
            link => link.source === node || link.target === node
          );
          return hasLinks ? -800 : -1600;
        }));
      }
    }
  }, [is3D, processedData.links]);

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

  // 노드 클릭 핸들러 수정
  const handleNodeClick = useCallback((node, event) => {
    // Ctrl + 클릭으로 노드 고정/해제
    if (event.ctrlKey) {
      if (node.fx !== undefined && node.fy !== undefined) {
        // 고정 해제
        node.fx = undefined;
        node.fy = undefined;
        if (is3D) {
          node.fz = undefined;
        }
      } else {
        // 현재 위치에 고정
        node.fx = node.x;
        node.fy = node.y;
        if (is3D) {
          node.fz = node.z;
        }
      }
      return;
    }

    // 기존의 더블클릭 및 클릭 로직
    if (lastClickedNode && lastClickedNode.id === node.id) {
      if (doubleClickTimerRef.current) {
        clearTimeout(doubleClickTimerRef.current);
        doubleClickTimerRef.current = null;
        
        // 더블클릭 시 상세 페이지로 이동
        navigate(`/mindmap/${node.chatRoomId}/${node.id}`);
        return;
      }
    }

    // 첫 번째 클릭 또는 단일 클릭
    setLastClickedNode(node);
    doubleClickTimerRef.current = setTimeout(() => {
      doubleClickTimerRef.current = null;
      setLastClickedNode(null);
      
      // 카메라 이동
      if (graphRef.current) {
        if (is3D) {
          const distance = 100;
          const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
          graphRef.current.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
            node,
            2000
          );
        } else {
          graphRef.current.centerAt(node.x, node.y, 1000);
        }
      }
      
      // 설명창 고정/해제 토글 및 위치 저장
      setFixedNode(prev => prev?.id === node.id ? null : node);
      setFixedPosition({ x: mousePosition.x, y: mousePosition.y });
    }, 300);
  }, [lastClickedNode, navigate, localData, processedData, is3D, mousePosition, graphRef]);

  // 노드 분리 핸들러 수정
  const handleNodeSplit = useCallback(async () => {
    try {
      if (!selectedNodeForEdit) {
        console.error('선택된 노드가 없습니다.');
        return;
      }

      // 먼저 UI에서 노드를 분리
      setLocalData(prevData => {
        const updatedRelationships = prevData.relationships.filter(rel => 
          !(rel.target === selectedNodeForEdit.id)
        );

        return {
          nodes: prevData.nodes,
          relationships: updatedRelationships
        };
      });

      // UI 업데이트 후 서버에 분리 요청
      await splitNode(selectedNodeForEdit.id);
      setSelectedNodeForEdit(null);
      setShowNodeModal(false);
    } catch (error) {
      console.error('노드 분리 중 오류 발생:', error);
      setLocalData(data);
      alert('노드 분리에 실패했습니다.');
    }
  }, [selectedNodeForEdit, data]);
  
  // 노드 삭제 핸들러 수정
  const handleNodeDelete = useCallback(async () => {
    try {
      if (!fixedNode) return;

      // 먼저 UI에서 노드를 제거
      setLocalData(prevData => {
        // 삭제할 노드와 관련된 관계들을 필터링
        const updatedRelationships = prevData.relationships.filter(rel => 
          rel.source !== fixedNode.id && rel.target !== fixedNode.id
        );

        // 노드 배열에서 해당 노드 제거
        const updatedNodes = prevData.nodes.filter(node => 
          node.id !== fixedNode.id
        );

        return {
          nodes: updatedNodes,
          relationships: updatedRelationships
        };
      });

      // UI 업데이트 후 서버에 삭제 요청
      await deleteNode(fixedNode.id);
      setFixedNode(null);
    } catch (error) {
      console.error('노드 삭제 중 오류 발생:', error);
      // 삭제 실패 시 원래 데이터로 복구
      setLocalData(data);
      alert('노드 삭제에 실패했습니다.');
    }
  }, [fixedNode, data]);

  // 노드 색상을 원래대로 되돌리기
  const getNodeColor = (node, isHighlighted) => {
    if (!isHighlighted) {
      return node.isRoot ? "rgba(255,107,107,0.6)" : "rgba(66,153,225,0.4)";
    }
    
    if (node.isPathNode) {
      return "rgba(245,158,11,0.9)"; // 루트까지의 경로는 주황색 유지
    }
    
    return node.isRoot ? "rgba(255,107,107,0.9)" : "rgba(66,153,225,0.9)";
  };

  // 링크 색상을 관계 타입에 따라 설정
  const getLinkColor = (link, isHighlighted) => {
    if (!isHighlighted) {
      return "#ffffff"; // 하이라이트되지 않은 링크는 원래 설정 유지
    }
    
    if (link.isPathLink) {
      return "rgba(245,158,11,0.9)"; // 루트까지의 경로
    }
    
    // 관계 타입에 따른 색상
    switch (link.type) {
      case "RELATED_TO":
        return "rgba(52,211,153,0.9)"; // 초록색
      case "HAS_SUBTOPIC":
        return "rgba(99,102,241,0.9)"; // 인디고색
      case "COMPARE_TO":
        return "rgba(236,72,153,0.9)"; // 핑크색
      default:
        return "rgba(255,255,255,0.8)";
    }
  };

  // 링크 두께 설정 함수 추가
  const getLinkWidth = (link, isHighlighted) => {
    if (!isHighlighted) {
      return 1; // 하이라이트되지 않은 링크는 기본 두께
    }
    return 3; // 하이라이트된 링크는 두껍게
  };

  return (
    <div className="relative w-full h-full">
      {/* 검색창 컨테이너 */}
      <div className="absolute left-4 top-4 z-50 flex items-center gap-4">
        {/* 기존 검색창 컨테이너 */}
        <div className="relative">
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

      {/* ? 버튼과 설명창 컨테이너 */}
      <div className="absolute right-4 top-4 z-50">
        {/* ? 버튼 */}
        <button
          className="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center text-gray-700 hover:bg-opacity-100 shadow-lg font-bold"
          onMouseEnter={() => setHoverLegend(true)}
          onMouseLeave={() => setHoverLegend(false)}
          onClick={() => setShowLegend(!showLegend)}
        >
          ?
        </button>

        {/* 색상 범례 - 호버 또는 클릭 시 표시 */}
        {(hoverLegend || showLegend) && (
          <div 
            className="absolute right-10 top-0 bg-white rounded-lg shadow-lg"
            style={{ 
              backgroundColor: showLegend ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.5)',
              minWidth: 'max-content'
            }}
          >
            <div className="p-4">
              <h3 className="text-gray-800 font-bold mb-2">연결선 관계 색상 설명</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "rgba(245,158,11,0.9)" }}></div>
                  <span className="text-sm text-gray-700 whitespace-nowrap">루트까지의 경로</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "rgba(52,211,153,0.9)" }}></div>
                  <span className="text-sm text-gray-700 whitespace-nowrap">관련 관계</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "rgba(99,102,241,0.9)" }}></div>
                  <span className="text-sm text-gray-700 whitespace-nowrap">하위 주제</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "rgba(236,72,153,0.9)" }}></div>
                  <span className="text-sm text-gray-700 whitespace-nowrap">비교 관계</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2D/3D 전환 버튼 */}
      <button
        className="absolute bottom-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg"
        onClick={() => setIs3D(!is3D)}
      >
        {is3D ? '2D로 보기' : '3D로 보기'}
      </button>

      {/* 뒤로가기 버튼 추가 */}
      <button 
        className="absolute top-4 right-4 z-50 bg-gray-500 text-white px-4 py-2 rounded-lg"
        onClick={() => navigate('/mindmap')}
      >
        뒤로 가기
      </button>

      {/* 조건부 렌더링으로 2D/3D 그래프 전환 */}
      {is3D ? (
        <ForceGraph3D
          ref={graphRef}
          graphData={processedData}
          nodeThreeObject={node => {
            const sprite = new SpriteText(node.title);
            const isHighlighted = highlightNodes.has(node);
            
            // 텍스트 크기 계산
            const textLength = node.title.length;
            const baseSize = node.isRoot ? 10 : 8;
            const textHeight = baseSize;
            
            // 원형 모양을 위한 패딩과 반경 계산
            const padding = textHeight * 0.8;
            const radius = textHeight * 1.43;
            
            sprite.backgroundColor = getNodeColor(node, isHighlighted);
            sprite.borderWidth = 0;
            sprite.borderRadius = radius;
            sprite.padding = padding;
            sprite.textHeight = textHeight;
            
            // 텍스트 스타일 설정
            sprite.color = isHighlighted ? '#ffffff' : '#f8fafc';
            sprite.fontWeight = 'bold';
            sprite.strokeWidth = 0;
            
            // 텍스트를 여러 줄로 나누기
            if (textLength > 10) {
              sprite.text = node.title.match(/.{1,10}/g).join('\n');
            }
            
            return sprite;
          }}
          width={window.innerWidth - 256}
          height={window.innerHeight - 64}
          nodeRelSize={1}
          nodeVal={1}
          nodeColor={(node) => "#4299e1"}
          nodeOpacity={1}
          nodeCanvasObjectMode={() => "replace"}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const fontSize = node.isRoot ? 32 : 26;
            const { width, height } = getNodeSize(node.title, ctx, fontSize);
            const isHighlighted = highlightNodes.has(node);
            const radius = 16;

            ctx.save();

            // 노드 배경 그리기
            ctx.beginPath();
            ctx.roundRect(
              node.x - width / 2 - radius,
              node.y - height / 2 - radius,
              width + radius * 2,
              height + radius * 2,
              radius
            );
            
            // 배경색 설정
            ctx.fillStyle = getNodeColor(node, isHighlighted);
            ctx.fill();

            // 테두리 설정
            if (isHighlighted) {
              ctx.strokeStyle = node === hoverNode ? "#ff4444" : "#ffffff";
              ctx.lineWidth = 3;
              ctx.stroke();
            }

            // 텍스트 설정
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(node.title, node.x, node.y);

            ctx.restore();

            node.size = Math.max(width, height);
            node.width = width;
            node.height = height;
          }}
          linkWidth={(link) => getLinkWidth(link, highlightLinks.has(link))}
          linkColor={(link) => getLinkColor(link, highlightLinks.has(link))}
          linkOpacity={0.5} // 링크 불투명도를 최대로 설정
          linkDirectionalParticles={4}
          linkDirectionalParticleWidth={(link) => (highlightLinks.has(link) ? 4 : 0)}
          linkDirectionalParticleSpeed={0.005}
          onNodeHover={(node) => {
            // 이전 타이머가 있다면 취소
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = null;
            }

            if (node) {
              setHoverNode(node);
              document.body.style.cursor = "pointer";
            } else {
              // 새로운 타이머 설정 및 참조 저장
              hoverTimeoutRef.current = setTimeout(() => {
                setHoverNode(prev => {
                  if (document.querySelector('.fixed:hover')) {
                    return prev;
                  }
                  return null;
                });
                hoverTimeoutRef.current = null;
              }, 100);
              document.body.style.cursor = "default";
            }
          }}
          onNodeDragEnd={(node) => {
            // 노드 드래그 후 고정 기능 주석 처리
            // node.fx = node.x
            // node.fy = node.y
            // if (is3D) {
            //   node.fz = node.z
            // }
          }}
          d3Force="charge"
          d3ForceStrength={-30}  // 집중형 배치를 위한 약한 반발력
          linkDistance={100}      // 짧은 링크 거리
          nodeLabel={(node) => ""}
          backgroundColor="#353A3E"
          nodePointerAreaPaint={(node, color, ctx) => {
            const fontSize = 12
            const { width, height } = getNodeSize(node.title, ctx, fontSize)

            // 호버 영역을 노드의 실제 크기로 설정
            ctx.fillStyle = color
            ctx.fillRect(node.x - width / 2, node.y - height / 2, width, height)
          }}
          onNodeClick={handleNodeClick}
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
            const fontSize = node.isRoot ? 32 : 26;
            const { width, height } = getNodeSize(node.title, ctx, fontSize);
            const isHighlighted = highlightNodes.has(node);
            const radius = 16;

            ctx.save();

            // 노드 배경 그리기
            ctx.beginPath();
            ctx.roundRect(
              node.x - width / 2 - radius,
              node.y - height / 2 - radius,
              width + radius * 2,
              height + radius * 2,
              radius
            );
            
            // 배경색 설정
            ctx.fillStyle = getNodeColor(node, isHighlighted);
            ctx.fill();

            // 테두리 설정
            if (isHighlighted) {
              ctx.strokeStyle = node === hoverNode ? "#ff4444" : "#ffffff";
              ctx.lineWidth = 3;
              ctx.stroke();
            }

            // 텍스트 설정
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(node.title, node.x, node.y);

            ctx.restore();

            node.size = Math.max(width, height);
            node.width = width;
            node.height = height;
          }}
          linkWidth={(link) => getLinkWidth(link, highlightLinks.has(link))}
          linkColor={(link) => getLinkColor(link, highlightLinks.has(link))}
          linkDirectionalParticles={4}
          linkDirectionalParticleWidth={(link) => (highlightLinks.has(link) ? 6 : 0)}
          linkDirectionalParticleSpeed={0.005}
          onNodeHover={(node) => {
            // 이전 타이머가 있다면 취소
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = null;
            }

            if (node) {
              setHoverNode(node);
              document.body.style.cursor = "pointer";
            } else {
              // 새로운 타이머 설정 및 참조 저장
              hoverTimeoutRef.current = setTimeout(() => {
                setHoverNode(prev => {
                  if (document.querySelector('.fixed:hover')) {
                    return prev;
                  }
                  return null;
                });
                hoverTimeoutRef.current = null;
              }, 100);
              document.body.style.cursor = "default";
            }
          }}
          onNodeDragEnd={(node) => {
            // 노드 드래그 후 고정 기능 주석 처리
            // node.fx = node.x
            // node.fy = node.y
          }}
          d3Force="charge"
          d3ForceStrength={-200} // 확산형 배치를 위한 강한 반발력
          linkDistance={200}     // 긴 링크 거리
          nodeLabel={(node) => ""}
          backgroundColor="#353A3E"
          nodePointerAreaPaint={(node, color, ctx) => {
            const fontSize = 12
            const { width, height } = getNodeSize(node.title, ctx, fontSize)

            // 호버 영역을 노드의 실제 크기로 설정
            ctx.fillStyle = color
            ctx.fillRect(node.x - width / 2, node.y - height / 2, width, height)
          }}
          onNodeClick={handleNodeClick}
        />
      )}

      {/* 호버 노드 설명창 */}
      {hoverNode && !fixedNode && (
        <div
          className="fixed bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-xs node-info-popup"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y + 10,
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.5)', // 배경색에 투명도 적용
          }}
        >
          <h3 className="font-bold text-lg mb-2">{hoverNode.title}</h3>
          <p className="text-gray-600 mb-4">{hoverNode.content}</p>
        </div>
      )}

      {/* 고정된 노드 설명창 추가 */}
      {fixedNode && (
        <div
          className="fixed bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-xs node-info-popup"
          style={{
            right: '2rem',
            bottom: '4rem',
            zIndex: 1000,
          }}
        >
          <h3 className="font-bold text-lg mb-2">{fixedNode.title}</h3>
          <p className="text-gray-600 mb-4">{fixedNode.content}</p>
          {!fixedNode.id.startsWith('root_') && (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedNodeForEdit(fixedNode);
                  handleNodeSplit();
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                분리
              </button>
              <button
                onClick={() => handleNodeDelete()}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                삭제
              </button>
            </div>
          )}
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

Mindmaproom.propTypes = {
  data: PropTypes.object.isRequired,
  onDataUpdate: PropTypes.func.isRequired
};

export default Mindmaproom
