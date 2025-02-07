import axios from 'axios';
// import testchatroomData from './testchatroom.json';

// 개발 환경에서는 mock 서버 URL 사용
const BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001'
  : 'http://your-backend-url/api';

export const fetchMindmapData = async (chatRoomId = null) => {
  try {
    const endpoint = '/mindmap';
    console.log(`Fetching from: ${BASE_URL}${endpoint}`);
    
    const response = await axios.get(`${BASE_URL}${endpoint}`);
    console.log('Response data:', response.data);
    
    // mindmap 객체에서 data를 추출
    const mindmapData = response.data.data || response.data;
    
    if (chatRoomId) {
      // chatRoomId로 필터링
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
    // 에러 발생 시 테스트 데이터 반환
    console.log('Fallback to test data');
    return testchatroomData;
  }
}; 