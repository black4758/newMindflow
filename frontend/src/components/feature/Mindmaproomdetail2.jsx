import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { fetchMindmapData, deleteNode } from '../../api/mindmap';
import PropTypes from 'prop-types';

const styles = {
  container: {
    width: '100%',
    height: '100vh',
    margin: 0,
    position: 'relative'
  },
  searchContainer: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: '10px',
    borderRadius: '5px',
    boxShadow: '0 0 10px rgba(0,0,0,0.2)',
    display: 'flex',
    gap: '10px'
  },
  searchInput: {
    padding: '5px',
    width: '200px',
    marginBottom: '5px'
  },
  backButton: {
    padding: '5px 10px',
    cursor: 'pointer',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '4px'
  },
  searchResults: {
    position: 'absolute',
    top: '100%',
    left: '0',
    width: '200px',
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    borderRadius: '4px'
  },
  searchItem: {
    padding: '5px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.1)'
    }
  },
  nodeLabel: {
    fontSize: '12px',
    padding: '1px 4px',
    borderRadius: '4px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    userSelect: 'none',
  }
};

const extraRenderers = [new CSS2DRenderer()];

// Mindmap.jsx와 동일한 모드 관리 함수 사용
const getViewMode = () => {
  return localStorage.getItem('viewMode') === '3d';
};

const Mindmaproomdetail = ({ data: initialData }) => {
  const { chatRoomId, id } = useParams();
  const [processedData, setProcessedData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const fgRef = useRef();
  const [is3D, setIs3D] = useState(getViewMode());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);
  const [hiddenNodes, setHiddenNodes] = useState(new Set());
  const rawData = location.state?.graphData;
  const [fixedNode, setFixedNode] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [selectedNodeForEdit, setSelectedNodeForEdit] = useState(null);

  // 데이터 처리 로직
  useEffect(() => {
    if (!initialData || !chatRoomId || !id) return;

    // 선택된 노드를 중심 노드로 설정
    const centerNode = initialData.nodes.find(node => 
      node.chatRoomId === chatRoomId && node.id === id
    );

    if (!centerNode) return;

    // 필터링된 데이터 생성
    const processedData = {
      nodes: initialData.nodes.filter(node => node.chatRoomId === chatRoomId),
      relationships: initialData.relationships,
      centerNodeId: centerNode.id  // 중심 노드 ID 추가
    };

    setProcessedData(processedData);
  }, [initialData, chatRoomId, id]);

  if (!processedData) return <div>로딩 중...</div>;

  // findPathToRoot 함수를 먼저 정의
  const findPathToRoot = useCallback((nodeId, visited = new Set()) => {
    if (!processedData) return null;
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);

    // 현재 노드가 루트 노드인지 확인
    const isRoot = !processedData.relationships.some(rel => rel.target === nodeId);
    if (isRoot) return [nodeId];

    // 부모 노드들 찾기
    const parentRels = processedData.relationships.filter(rel => rel.target === nodeId);
    
    for (const rel of parentRels) {
      const path = findPathToRoot(rel.source, visited);
      if (path) {
        return [...path, nodeId];
      }
    }
    
    return null;
  }, [processedData]);

  // 초기 hiddenNodes 설정을 위한 useEffect
  useEffect(() => {
    if (!processedData) return;

    const centerNodeId = processedData.centerNodeId;
    if (!centerNodeId) return;

    // 모든 노드 ID 수집
    const allNodeIds = new Set(processedData.nodes.map(node => node.id));
    
    // 직계 하위노드 찾기
    const directChildren = new Set();
    processedData.relationships.forEach(rel => {
      if (rel.source === centerNodeId) {
        directChildren.add(rel.target);
      }
    });

    // 루트까지의 경로 찾기
    const pathToRoot = findPathToRoot(centerNodeId);
    const pathNodes = new Set(pathToRoot || []);

    // 초기 hiddenNodes 설정
    const initialHiddenNodes = new Set();
    allNodeIds.forEach(nodeId => {
      // 노드가 다음 조건에 해당하면 표시, 아니면 숨김
      // 1. 중심 노드이거나
      // 2. 직계 하위노드이거나
      // 3. 루트까지의 경로상에 있는 노드
      if (
        nodeId !== centerNodeId && 
        !directChildren.has(nodeId) && 
        !pathNodes.has(nodeId)
      ) {
        initialHiddenNodes.add(nodeId);
      }
    });

    setHiddenNodes(initialHiddenNodes);
  }, [processedData, findPathToRoot]);

  // 노드가 표시 가능한 상태인지 확인하는 함수
  const isNodeVisible = useCallback((nodeId) => {
    if (!processedData) return false;
    
    // 숨김 상태인 노드는 표시하지 않음
    if (hiddenNodes.has(nodeId)) return false;
    
    // 루트까지의 경로에 있는 노드는 항상 표시
    const pathToRoot = findPathToRoot(nodeId);
    if (!pathToRoot) return false;
    
    // 루트까지의 경로상에 숨겨진 노드가 있으면 표시하지 않음
    for (const pathNodeId of pathToRoot) {
      if (hiddenNodes.has(pathNodeId)) return false;
    }
    
    return true;
  }, [processedData, hiddenNodes, findPathToRoot]);

  // 받은 데이터를 ForceGraph3D 형식으로 변환
  const data = useMemo(() => {
    if (!processedData) return null;

    // 노드의 레벨(level) 계산 함수
    const calculateLevel = (nodeId, parentId = null, level = 0, visited = new Set()) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = processedData.nodes.find(n => n.id === nodeId);
      if (node) {
        node.level = level;
      }

      const children = processedData.relationships
        .filter(rel => rel.source === nodeId)
        .map(rel => rel.target);

      children.forEach(childId => {
        calculateLevel(childId, nodeId, level + 1, visited);
      });
    };

    // 루트 노드들 찾기
    const rootNodes = processedData.nodes
      .filter(node => !processedData.relationships.some(rel => rel.target === node.id))
      .map(node => node.id);

    // 각 루트 노드에서 시작하여 레벨 계산
    rootNodes.forEach(rootId => calculateLevel(rootId));

    // 색상 배열 정의
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const rootColor = '#FF6B6B'; // 루트 노드용 특별 색상
    const centerNodeColor = '#FFD700'; // 중심(선택된) 노드용 노란색

    // 그래프 데이터 생성
    const gData = {
      nodes: processedData.nodes.map(node => {
        const isRoot = !processedData.relationships.some(rel => rel.target === node.id);
        const isCenterNode = node.id === processedData.centerNodeId; // 중심 노드 여부 확인
        return {
          ...node,
          color: isCenterNode ? centerNodeColor : isRoot ? rootColor : colors[node.level % colors.length],
          isRoot,
          isCenterNode
        };
      }),
      links: processedData.relationships.map(rel => ({
        source: rel.source,
        target: rel.target,
        type: rel.type
      }))
    };

    // cross-link node objects
    gData.links.forEach(link => {
      const a = gData.nodes.find(node => node.id === link.source);
      const b = gData.nodes.find(node => node.id === link.target);
      
      !a.neighbors && (a.neighbors = []);
      !b.neighbors && (b.neighbors = []);
      a.neighbors.push(b);
      b.neighbors.push(a);

      !a.links && (a.links = []);
      !b.links && (b.links = []);
      a.links.push(link);
      b.links.push(link);
    });

    return gData;
  }, [processedData]);

  // 검색 관련 코드 수정
  const handleSearchChange = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    
    if (term.trim() && data) {  // data 존재 여부 확인 추가
      const results = data.nodes.filter(node => 
        node.title.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleNodeFocus = useCallback(node => {
    const distance = 40;
    if (is3D) {
      const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        node,
        3000
      );
    } else {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(2, 1000);
    }
  }, [is3D]);

  // updateHighlight 함수 수정
  const updateHighlight = useCallback(() => {
    if (!hoverNode) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      // 모든 노드의 속성 초기화
      data?.nodes.forEach(node => {
        node.isPathNode = false;
        node.relationType = null;
      });
      // 모든 링크의 속성 초기화
      data?.links.forEach(link => {
        link.isPathLink = false;
      });
      return;
    }

    // 하이라이트 시작 전에 모든 노드와 링크의 속성 초기화
    data?.nodes.forEach(node => {
      node.isPathNode = false;
      node.relationType = null;
    });
    data?.links.forEach(link => {
      link.isPathLink = false;
    });

    // 연결된 노드들과 관계 타입 찾기
    const connectedNodesWithTypes = data?.links
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
      node.relationType = type;
      
      // 해당 링크 찾기
      const link = data?.links.find(l => 
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
        const node = data?.nodes.find(n => n.id === nodeId);
        if (node) {
          node.isPathNode = true;
          highlightedNodes.add(node);
        }
      });
      
      data?.links.forEach(link => {
        if (path.includes(link.source.id || link.source) && 
            path.includes(link.target.id || link.target)) {
          link.isPathLink = true;
          highlightedLinks.add(link);
        }
      });
    }

    setHighlightNodes(highlightedNodes);
    setHighlightLinks(highlightedLinks);
  }, [hoverNode, data?.links, data?.nodes, findPathToRoot]);

  // useEffect 추가
  useEffect(() => {
    updateHighlight();
  }, [updateHighlight]);

  // 노드 호버 핸들러 수정
  const handleNodeHover = useCallback((node) => {
    setHoverNode(node);
    if (node) {
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "default";
    }
  }, []);

  // nodeThreeObject 수정
  const nodeThreeObject = node => {
    const sprite = new SpriteText(node.title);
    const isHighlighted = highlightNodes.has(node);
    const hasHiddenChilds = hasHiddenChildren(node.id);
    
    const textLength = node.title.length;
    const baseSize = node.isRoot ? 10 : 8;
    const textHeight = baseSize;
    
    const padding = textHeight * 0.8;
    const radius = textHeight * 1.43;
    
    sprite.backgroundColor = getNodeColor(node, isHighlighted);
    sprite.borderWidth = hasHiddenChilds ? 2 : 0;
    sprite.borderColor = hasHiddenChilds ? '#4299e1' : 'transparent';
    sprite.borderRadius = radius;
    sprite.padding = padding;
    sprite.textHeight = textHeight;
    
    sprite.color = isHighlighted ? '#ffffff' : '#f8fafc';
    sprite.fontWeight = 'bold';
    sprite.strokeWidth = 0;
    
    if (textLength > 10) {
      sprite.text = node.title.match(/.{1,10}/g).join('\n');
    }
    
    return sprite;
  };

  // Mindmap.jsx의 getNodeSize 함수 추가
  const getNodeSize = (text, ctx, fontSize) => {
    ctx.font = `${fontSize}px Sans-Serif`;
    const textWidth = ctx.measureText(text).width;
    const width = textWidth + 20;
    const height = fontSize + 10;
    return { width, height };
  };

  // 직속 하위 노드 찾는 함수를 먼저 정의
  const findDirectChildren = useCallback((nodeId) => {
    if (!data) return new Set();
    
    const children = new Set();
    data.links.forEach(link => {
      if (link.source.id === nodeId || link.source === nodeId) {
        const targetId = link.target.id || link.target;
        children.add(targetId);
      }
    });
    
    return children;
  }, [data]);

  // hasHiddenChildren 함수 정의
  const hasHiddenChildren = useCallback((nodeId) => {
    if (!data) return false;
    const directChildren = findDirectChildren(nodeId);
    return Array.from(directChildren).some(childId => hiddenNodes.has(childId));
  }, [data, findDirectChildren, hiddenNodes]);

  // 나머지 함수들...
  const hasChildren = useCallback((nodeId) => {
    if (!data) return false;
    return data.links.some(link => link.source.id === nodeId || link.source === nodeId);
  }, [data]);

  // getNodeColor 함수 수정
  const getNodeColor = (node, isHighlighted) => {
    const hasChildNodes = hasChildren(node.id);
    const hasHiddenChilds = hasHiddenChildren(node.id);
    
    if (!isHighlighted) {
      if (node.isCenterNode) {
        return hasChildNodes 
          ? hasHiddenChilds 
            ? "rgba(255,215,0,0.9)"  // 선택된 노드 (숨겨진 하위노드 있음)
            : "rgba(255,215,0,0.6)"  // 선택된 노드 (모든 하위노드 표시)
          : "rgba(255,215,0,0.6)";   // 선택된 노드 (하위노드 없음)
      }
      if (node.isRoot) {
        return hasChildNodes 
          ? hasHiddenChilds 
            ? "rgba(255,107,107,0.9)"  // 루트 노드 (숨겨진 하위노드 있음)
            : "rgba(255,107,107,0.6)"  // 루트 노드 (모든 하위노드 표시)
          : "rgba(255,107,107,0.6)";   // 루트 노드 (하위노드 없음)
      }
      return hasChildNodes
        ? hasHiddenChilds
          ? "rgba(66,153,225,0.8)"     // 일반 노드 (숨겨진 하위노드 있음)
          : "rgba(66,153,225,0.4)"     // 일반 노드 (모든 하위노드 표시)
        : "rgba(66,153,225,0.4)";      // 일반 노드 (하위노드 없음)
    }
    
    if (node.isPathNode) {
      return hasChildNodes ? "rgba(245,158,11,1)" : "rgba(245,158,11,0.9)";
    }
    
    if (node.isCenterNode) {
      return hasChildNodes ? "rgba(255,215,0,1)" : "rgba(255,215,0,0.9)";
    }
    
    if (node.isRoot) {
      return hasChildNodes ? "rgba(255,107,107,1)" : "rgba(255,107,107,0.9)";
    }
    
    return hasChildNodes ? "rgba(66,153,225,1)" : "rgba(66,153,225,0.9)";
  };

  // 링크 색상을 관계 타입에 따라 설정
  const getLinkColor = (link, isHighlighted) => {
    if (!isHighlighted) {
      return "#ffffff";
    }
    
    if (link.isPathLink) {
      return "rgba(245,158,11,0.9)"; // 루트까지의 경로
    }
    
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
    return isHighlighted ? 3 : 1;
  };

  // 공통 props 정의
  const commonProps = {
    linkWidth: 1,
    linkColor: (link) => (highlightLinks.has(link) ? "#94a3b8" : "rgba(226, 232, 240, 0.2)"),
    linkDirectionalParticles: 4,
    linkDirectionalParticleWidth: (link) => (highlightLinks.has(link) ? 2 : 0),
    linkDirectionalParticleSpeed: 0.005,
    onNodeHover: (node) => {
      setHoverNode(node);
      if (node) {
        document.body.style.cursor = "pointer";
      } else {
        document.body.style.cursor = "default";
      }
    },
    onNodeDragEnd: (node) => {
      node.fx = node.x;
      node.fy = node.y;
    },
    d3Force: "charge",
    d3ForceStrength: -100,
    linkDistance: 200,
    nodeLabel: (node) => "",
    backgroundColor: "#ffffff",
    nodePointerAreaPaint: (node, color, ctx) => {
      const fontSize = 12;
      const { width, height } = getNodeSize(node.title, ctx, fontSize);
      ctx.fillStyle = color;
      ctx.fillRect(node.x - width / 2, node.y - height / 2, width, height);
    },
    onNodeClick: handleNodeFocus
  };

  // useEffect 수정
  useEffect(() => {
    if (fgRef.current) {
      if (is3D) {
        // 3D 모드: 집중형 배치
        fgRef.current.d3Force("charge").strength(-30);
        fgRef.current.d3Force("link").distance(50);
      } else {
        // 2D 모드: 확산형 배치
        fgRef.current.d3Force("charge").strength(-200);
        fgRef.current.d3Force("link").distance(200);
      }
    }
  }, [is3D]);

  // 모든 하위 노드 찾는 함수
  const findAllDescendants = useCallback((nodeId, visited = new Set()) => {
    if (!data || visited.has(nodeId)) return new Set();
    
    visited.add(nodeId);
    const descendants = new Set();
    
    data.links.forEach(link => {
      if (link.source.id === nodeId || link.source === nodeId) {
        const targetId = link.target.id || link.target;
        descendants.add(targetId);
        const childDescendants = findAllDescendants(targetId, visited);
        childDescendants.forEach(id => descendants.add(id));
      }
    });
    
    return descendants;
  }, [data]);

  // 노드의 모든 상위 노드를 찾는 함수 추가
  const findAllAncestors = useCallback((nodeId, visited = new Set()) => {
    if (!data || visited.has(nodeId)) return new Set();
    
    visited.add(nodeId);
    const ancestors = new Set();
    
    data.links.forEach(link => {
      const targetId = link.target.id || link.target;
      if (targetId === nodeId) {
        const sourceId = link.source.id || link.source;
        ancestors.add(sourceId);
        const parentAncestors = findAllAncestors(sourceId, visited);
        parentAncestors.forEach(id => ancestors.add(id));
      }
    });
    
    return ancestors;
  }, [data]);

  // 노드 클릭 핸들러 수정
  const handleNodeClick = useCallback((node, event) => {
    const centerNodeId = processedData.centerNodeId;
    if (!centerNodeId) return;

    // 중심 노드에서 루트까지의 경로 찾기
    const centerToRootPath = findPathToRoot(centerNodeId);
    const protectedNodes = new Set(centerToRootPath || []);

    // 직계 하위노드 찾기
    const directChildren = new Set();
    processedData.relationships.forEach(rel => {
      if (rel.source === node.id) {
        // 보호된 노드의 하위 노드는 토글 대상에서 제외
        if (!protectedNodes.has(rel.target)) {
          directChildren.add(rel.target);
        }
      }
    });

    setHiddenNodes(prev => {
      const newHidden = new Set(prev);
      
      // 직계 하위 노드들이 모두 숨겨져 있는지 확인
      const allDirectChildrenHidden = Array.from(directChildren)
        .every(childId => prev.has(childId));
      
      // 보호된 노드들은 항상 표시
      protectedNodes.forEach(pathNodeId => {
        newHidden.delete(pathNodeId);
      });

      // 직계 하위 노드들의 표시 상태 토글
      // 보호된 노드가 아닌 경우에만 토글
      directChildren.forEach(childId => {
        if (!protectedNodes.has(childId)) {  // 보호된 노드가 아닌 경우에만 토글
          if (allDirectChildrenHidden) {
            newHidden.delete(childId);
          } else {
            newHidden.add(childId);
          }
        }
      });

      return newHidden;
    });

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

    // 설명창 고정/해제 토글 및 위치 저장
    setFixedNode(prev => prev?.id === node.id ? null : node);
    setMousePosition({ x: event.clientX, y: event.clientY });
  }, [is3D, processedData, findPathToRoot]);

  // filteredData 수정
  const filteredData = useMemo(() => {
    if (!data) return null;

    return {
      nodes: data.nodes.filter(node => isNodeVisible(node.id)),
      links: data.links.filter(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return isNodeVisible(sourceId) && isNodeVisible(targetId);
      })
    };
  }, [data, isNodeVisible]);

  // 마우스 이동 이벤트 핸들러
  const handleMouseMove = useCallback((e) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  // 컴포넌트 마운트 시 이벤트 리스너 추가
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  // 설명창 외부 클릭 핸들러
  const handleOutsideClick = useCallback((e) => {
    if (fixedNode && !e.target.closest('.node-info-popup')) {
      setFixedNode(null);
    }
  }, [fixedNode]);

  useEffect(() => {
    if (fixedNode) {
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  }, [fixedNode, handleOutsideClick]);

  // ESC 키 핸들러
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setFixedNode(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 노드 분리 핸들러 (나중에 구현을 위해 주석 처리)
  const handleNodeSplit = useCallback(async () => {
    try {
      // await splitNode(selectedNodeForEdit.id);
      // 성공 시 마인드맵 데이터 새로고침
      // await refreshMindmapData();
      setShowNodeModal(false);
    } catch (error) {
      // console.error('노드 분리 중 오류 발생:', error);
      // alert('노드 분리에 실패했습니다.');
    }
  }, [selectedNodeForEdit]);

  // 노드 삭제 핸들러 추가
  const handleNodeDelete = useCallback(async () => {
    try {
      if (!fixedNode) {
        console.error('선택된 노드가 없습니다.');
        return;
      }

      await deleteNode(fixedNode.id);
      
      // 성공 시 마인드맵 데이터 새로고침
      const updatedData = await fetchMindmapData();
      setProcessedData(updatedData);
      
      // 노드 상태 초기화
      setFixedNode(null);
    } catch (error) {
      console.error('노드 삭제 중 오류 발생:', error);
      alert('노드 삭제에 실패했습니다.');
    }
  }, [fixedNode]);

  return (
    <div className="relative w-full h-full">
      {/* 검색창과 설명창 컨테이너 */}
      <div className="absolute left-4 top-4 z-50">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="노드 검색..."
            className="w-64 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
              {searchResults.map((node) => (
                <div
                  key={node.id}
                  onClick={() => handleNodeFocus(node)}
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

      {/* 2D/3D 전환 버튼 */}
      <button
        className="absolute bottom-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg"
        onClick={() => setIs3D(!is3D)}
      >
        {is3D ? '2D로 보기' : '3D로 보기'}
      </button>

      {/* 뒤로가기 버튼 수정 */}
      <button 
        className="absolute top-4 right-4 z-50 bg-gray-500 text-white px-4 py-2 rounded-lg"
        onClick={() => navigate(`/mindmap/${chatRoomId}`)}
      >
        뒤로 가기
      </button>

      {is3D ? (
        <ForceGraph3D
          ref={fgRef}
          graphData={filteredData}
          nodeThreeObject={node => {
            const sprite = new SpriteText(node.title);
            const isHighlighted = highlightNodes.has(node);
            const hasHiddenChilds = hasHiddenChildren(node.id);
            
            const textLength = node.title.length;
            const baseSize = node.isRoot ? 10 : 8;
            const textHeight = baseSize;
            
            const padding = textHeight * 0.8;
            const radius = textHeight * 1.43;
            
            sprite.backgroundColor = getNodeColor(node, isHighlighted);
            sprite.borderWidth = hasHiddenChilds ? 2 : 0;
            sprite.borderColor = hasHiddenChilds ? '#4299e1' : 'transparent';
            sprite.borderRadius = radius;
            sprite.padding = padding;
            sprite.textHeight = textHeight;
            
            sprite.color = isHighlighted ? '#ffffff' : '#f8fafc';
            sprite.fontWeight = 'bold';
            sprite.strokeWidth = 0;
            
            if (textLength > 10) {
              sprite.text = node.title.match(/.{1,10}/g).join('\n');
            }
            
            return sprite;
          }}
          width={window.innerWidth - 256}
          height={window.innerHeight - 64}
          backgroundColor="#353A3E"
          linkWidth={(link) => getLinkWidth(link, highlightLinks.has(link))}
          linkColor={(link) => getLinkColor(link, highlightLinks.has(link))}
          linkDirectionalParticles={4}
          linkDirectionalParticleWidth={link => highlightLinks.has(link) ? 4 : 0}
          linkDirectionalParticleSpeed={0.005}
          onNodeHover={handleNodeHover}
          onNodeClick={handleNodeClick}
          d3Force="charge"
          d3ForceStrength={-30}
          linkDistance={100}
        />
      ) : (
        <ForceGraph2D
          ref={fgRef}
          graphData={filteredData}
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
            const hasHiddenChilds = hasHiddenChildren(node.id);
            const hasChildNodes = hasChildren(node.id);

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
            if (isHighlighted || (hasChildNodes && hasHiddenChilds)) {
              ctx.strokeStyle = node === hoverNode 
                ? "#ff4444" 
                : hasHiddenChilds 
                  ? "#4299e1" 
                  : "#ffffff";
              ctx.lineWidth = hasHiddenChilds ? 2 : 3;
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
          linkDirectionalParticleWidth={link => highlightLinks.has(link) ? 6 : 0}
          linkDirectionalParticleSpeed={0.005}
          onNodeHover={handleNodeHover}
          onNodeDragEnd={(node) => {
            node.fx = node.x;
            node.fy = node.y;
          }}
          d3Force="charge"
          d3ForceStrength={-200}
          linkDistance={200}
          nodeLabel={(node) => ""}
          backgroundColor="#353A3E"
          nodePointerAreaPaint={(node, color, ctx) => {
            const fontSize = 12;
            const { width, height } = getNodeSize(node.title, ctx, fontSize);
            ctx.fillStyle = color;
            ctx.fillRect(node.x - width / 2, node.y - height / 2, width, height);
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

      {/* 고정된 노드 설명창 */}
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
          {/* chatroom 노드가 아닌 경우에만 버튼 표시 */}
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
  );
};

Mindmaproomdetail.propTypes = {
  data: PropTypes.object.isRequired
};

export default Mindmaproomdetail;