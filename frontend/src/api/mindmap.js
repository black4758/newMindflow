import axios from "axios"
// import testchatroomData from './testchatroom.json';
import { store } from "../store/store" // store.js에서 store import

const BASE_URL = import.meta.env.VITE_API_BASE_URL


export const fetchMindmapData = async (chatRoomId = null, nodeId = null) => {
  try {
    // Redux store에서 auth 상태 가져오기
    const authState = store.getState().auth
    console.log('유저정보:', authState);
    console.log('BASE_URL:', BASE_URL); 

    // // 사용자 정보 상세 출력
    // if (authState.user) {
    //   console.log('User ID:', authState.user.userId);
    //   console.log('Display Name:', authState.user.displayName);
    //   console.log('Access Token:', authState.user.accessToken);
    // }

    const endpoint = `/api/mindmaps/${authState.user.userId}`
    console.log(`Fetching from: ${BASE_URL}${endpoint}`)

    const response = await axios.get(`${BASE_URL}${endpoint}`)
    console.log("Response data:", response.data)

    // mindmap 객체에서 data를 추출하고 기본값 설정
    const mindmapData = response.data.data || response.data || { nodes: [], relationships: [] }

    if (nodeId && mindmapData.nodes && mindmapData.relationships) {
      // nodeId가 있는 경우: 특정 노드와 연결된 노드들만 반환
      const targetNode = mindmapData.nodes.find(node => node.id === nodeId);
      if (!targetNode) return { nodes: [], relationships: [] };

      // 루트 노드 찾기
      const findRootNode = (currentId, visited = new Set()) => {
        if (visited.has(currentId)) return null;
        visited.add(currentId);

        const isRoot = !mindmapData.relationships.some(rel => rel.target === currentId);
        if (isRoot) return currentId;

        const parentRels = mindmapData.relationships.filter(rel => rel.target === currentId);
        for (const rel of parentRels) {
          const rootId = findRootNode(rel.source, visited);
          if (rootId) return rootId;
        }
        return null;
      };

      // 연결된 모든 노드 찾기
      const rootNodeId = findRootNode(nodeId);
      const connectedNodes = new Set();
      
      const findAllConnectedNodes = (currentId) => {
        if (connectedNodes.has(currentId)) return;
        connectedNodes.add(currentId);

        mindmapData.relationships
          .filter(rel => rel.source === currentId)
          .forEach(rel => findAllConnectedNodes(rel.target));
      };

      if (rootNodeId) {
        findAllConnectedNodes(rootNodeId);
        return {
          nodes: mindmapData.nodes.filter(node => connectedNodes.has(node.id)),
          relationships: mindmapData.relationships.filter(rel => 
            connectedNodes.has(rel.source) && connectedNodes.has(rel.target)
          )
        };
      }
    } else if (chatRoomId && mindmapData.nodes && mindmapData.relationships) {
      // chatRoomId로 필터링된 데이터 반환
      return {
        nodes: mindmapData.nodes.filter((node) => node.chatRoomId === chatRoomId),
        relationships: mindmapData.relationships.filter((rel) => {
          const sourceNode = mindmapData.nodes.find((node) => node.id === rel.source);
          return sourceNode && sourceNode.chatRoomId === chatRoomId;
        }),
      };
    }

    return mindmapData.nodes && mindmapData.relationships ? mindmapData : { nodes: [], relationships: [] }
  } catch (error) {
    console.error("마인드맵 데이터 가져오기 실패:", error)
    return { nodes: [], relationships: [] }  // 에러 시 빈 객체 반환
  }
}

// 노드 분리 API
export const splitNode = async (nodeId) => {
  try {
    const authState = store.getState().auth;
    const elementId = nodeId;

    const response = await axios.post(
      `${BASE_URL}/api/mindmaps/seperateTopic/${elementId}/${authState.user.userId}`
    );

    // 서버에서 반환된 newChatRoomId를 반환
    return response.data.newChatRoomId;
  } catch (error) {
    console.error("노드 분리 실패:", error);
    throw error;
  }
};

// 노드 삭제 API
export const deleteNode = async (nodeId) => {
  try {
    // DELETE /api/mindmaps/nodes/{nodeId}
    const response = await axios.delete(`${BASE_URL}/api/mindmaps/deleteSubTopic/${nodeId}`)
    return response.data
  } catch (error) {
    console.error("노드 삭제 실패:", error)
    throw error
  }
}
