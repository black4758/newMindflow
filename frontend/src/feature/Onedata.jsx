import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { useLocation, useNavigate } from 'react-router-dom';

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

const Onedata = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fgRef = useRef();
  const [is3D, setIs3D] = useState(getViewMode());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);
  const rawData = location.state?.graphData;

  // 받은 데이터를 ForceGraph3D 형식으로 변환
  const data = useMemo(() => {
    if (!rawData) return null;

    // 노드의 레벨(level) 계산 함수
    const calculateLevel = (nodeId, parentId = null, level = 0, visited = new Set()) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      // 현재 노드 찾기
      const node = rawData.nodes.find(n => n.id === nodeId);
      if (node) {
        node.level = level;
      }

      // 자식 노드들의 레벨 계산
      const children = rawData.relationships
        .filter(rel => rel.source === nodeId)
        .map(rel => rel.target);

      children.forEach(childId => {
        calculateLevel(childId, nodeId, level + 1, visited);
      });
    };

    // 루트 노드들 찾기 (들어오는 엣지가 없는 노드들)
    const rootNodes = rawData.nodes
      .filter(node => !rawData.relationships.some(rel => rel.target === node.id))
      .map(node => node.id);

    // 각 루트 노드에서 시작하여 레벨 계산
    rootNodes.forEach(rootId => calculateLevel(rootId));

    // 색상 배열 정의 (레벨별 색상)
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    // 그래프 데이터 생성
    const gData = {
      nodes: rawData.nodes.map(node => ({
        ...node,
        label: node.title,
        color: colors[node.level % colors.length] // 레벨에 따라 색상 할당
      })),
      links: rawData.relationships.map(rel => ({
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
  }, [rawData]);

  // useEffect(() => {
  //   if (!data) {
  //     navigate('/test');
  //     return;
  //   }

  //   const bloomPass = new UnrealBloomPass();
  //   bloomPass.strength = 0.3;
  //   bloomPass.radius = 0;
  //   bloomPass.threshold = 0;
  //   fgRef.current.postProcessingComposer().addPass(bloomPass);
  // }, [data, navigate]);

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

  // 하이라이트 업데이트 함수
  const updateHighlight = () => {
    setHighlightNodes(new Set(highlightNodes));
    setHighlightLinks(new Set(highlightLinks));
  };

  // 노드 호버 핸들러
  const handleNodeHover = node => {
    highlightNodes.clear();
    highlightLinks.clear();
    if (node) {
      highlightNodes.add(node);
      node.neighbors?.forEach(neighbor => highlightNodes.add(neighbor));
      node.links?.forEach(link => highlightLinks.add(link));
    }

    setHoverNode(node || null);
    updateHighlight();
  };

  // 링크 호버 핸들러
  const handleLinkHover = link => {
    highlightNodes.clear();
    highlightLinks.clear();

    if (link) {
      highlightLinks.add(link);
      highlightNodes.add(link.source);
      highlightNodes.add(link.target);
    }

    updateHighlight();
  };

  // nodeThreeObject 수정
  const nodeThreeObject = node => {
    const sprite = new SpriteText(node.title);
    sprite.color = node.color;  // 원래 노드의 색상 유지
    sprite.textHeight = 8;
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

  return (
    <div style={styles.container}>
      <div style={styles.searchContainer}>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="노드 검색..."
          style={styles.searchInput}
        />
        <button 
          style={styles.backButton}
          onClick={() => navigate('/mindmap')}
        >
          뒤로 가기
        </button>
        {searchResults.length > 0 && (
          <div style={styles.searchResults}>
            {searchResults.map(node => (
              <div
                key={node.id}
                onClick={() => handleNodeFocus(node)}
                style={styles.searchItem}
              >
                {node.title}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className="fixed bottom-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg"
        onClick={() => setIs3D(!is3D)}
      >
        {is3D ? '2D로 보기' : '3D로 보기'}
      </button>

      {is3D ? (
        <ForceGraph3D
          ref={fgRef}
          graphData={data}
          nodeThreeObject={node => {
            const sprite = new SpriteText(node.title);
            sprite.color = node.color;
            sprite.textHeight = 8;
            return sprite;
          }}
          {...commonProps}
        />
      ) : (
        <ForceGraph2D
          ref={fgRef}
          graphData={data}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const fontSize = 12;
            const { width, height } = getNodeSize(node.title, ctx, fontSize);
            const isHighlighted = highlightNodes.has(node);
            const radius = 5;

            ctx.save();

            // 텍스트 박스 그리기
            ctx.beginPath();
            ctx.moveTo(node.x - width / 2 + radius, node.y - height / 2);
            ctx.lineTo(node.x + width / 2 - radius, node.y - height / 2);
            ctx.quadraticCurveTo(node.x + width / 2, node.y - height / 2, node.x + width / 2, node.y - height / 2 + radius);
            ctx.lineTo(node.x + width / 2, node.y + height / 2 - radius);
            ctx.quadraticCurveTo(node.x + width / 2, node.y + height / 2, node.x + width / 2 - radius, node.y + height / 2);
            ctx.lineTo(node.x - width / 2 + radius, node.y + height / 2);
            ctx.quadraticCurveTo(node.x - width / 2, node.y + height / 2, node.x - width / 2, node.y + height / 2 - radius);
            ctx.lineTo(node.x - width / 2, node.y - height / 2 + radius);
            ctx.quadraticCurveTo(node.x - width / 2, node.y - height / 2, node.x - width / 2 + radius, node.y - height / 2);
            ctx.closePath();

            // 배경색 설정
            ctx.fillStyle = isHighlighted ? "#4299e1" : node.color.replace(')', ', 0.5)').replace('rgb', 'rgba');
            ctx.fill();

            // 테두리 설정
            if (isHighlighted) {
              ctx.strokeStyle = node === hoverNode ? "#ef4444" : "#f59e0b";
              ctx.lineWidth = 2;
              ctx.stroke();
            }

            // 텍스트 설정
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = isHighlighted ? "#ffffff" : "#1a365d";
            ctx.fillText(node.title, node.x, node.y);

            ctx.restore();

            // 노드의 실제 크기 설정
            node.size = Math.max(width, height);
            node.width = width;
            node.height = height;
          }}
          {...commonProps}
        />
      )}

      {/* 호버 시 보여줄 상세 정보 팝업 */}
      {hoverNode && (
        <div
          className="fixed bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-xs"
          style={{
            left: `${hoverNode.x + (window.innerWidth - 256) / 2}px`,
            top: `${hoverNode.y + (window.innerHeight - 64) / 2 - hoverNode.height - 60}px`,
            transform: "translateX(-50%)",
            zIndex: 1000,
          }}
        >
          <h3 className="font-bold text-lg mb-2">{hoverNode.title}</h3>
          <p className="text-gray-600">{hoverNode.content}</p>
        </div>
      )}
    </div>
  );
};

export default Onedata;