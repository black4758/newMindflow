import axios from 'axios';
// import testchatroomData from './testchatroom.json';

// 개발 환경에서는 mock 서버 URL 사용
const BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8453'
  : 'http://your-backend-url/api';

export const fetchMindmapData = async (chatRoomId = null) => {
  try {
    const endpoint = '/api/mindmaps/REDACTED123';
    console.log(`Fetching from: ${BASE_URL}${endpoint}`);
    
    const response = await axios.get(`${BASE_URL}${endpoint}`);
    console.log('Response data:', response.data);
    
    // mindmap 객체에서 data를 추출
    const mindmapData = response.data.data || response.data;
    
    if (chatRoomId) {
      // chatRoomId로 필터링된 데이터 반환
      return {
        nodes: mindmapData.nodes.filter(node => node.chatRoomId === chatRoomId),
        relationships: mindmapData.relationships.filter(rel => {
          const sourceNode = mindmapData.nodes.find(node => node.id === rel.source);
          return sourceNode && sourceNode.chatRoomId === chatRoomId;
        })
      };
    }
    
    return mindmapData;
  } catch (error) {
    console.error('마인드맵 데이터 가져오기 실패:', error);
    return null;
  }
};

// 노드 분리 API
export const splitNode = async (nodeId) => {
  try {
    const elementId = nodeId

    console.log(nodeId)
    console.log(`${BASE_URL}/api/mindmaps/seperateTopic/${elementId}/2`)
    // creatorId를 숫자로 설정 (예: 123)
    const creatorId = 123; // 실제 사용자 ID로 변경 필요
    
    // elementId에서 UUID 부분만 추출 (예: e0ff3137-379d-4f62-a816-37fb9474bd92)
    
    const response = await axios.post(
      `${BASE_URL}/api/mindmaps/seperateTopic/${elementId}/2`
    );
    
    console.log('분리 응답:', response.data); // 새로운 채팅방 ID 반환
    return response.data;
  } catch (error) {
    console.error('노드 분리 실패:', error);
    throw error;
  }
};

// 노드 삭제 API
export const deleteNode = async (nodeId) => {
  try {
    // DELETE /api/mindmaps/nodes/{nodeId}
    const response = await axios.delete(`${BASE_URL}/api/mindmaps/deleteSubTopic/${nodeId}`);
    return response.data;
  } catch (error) {
    console.error('노드 삭제 실패:', error);
    throw error;
  }

}; 