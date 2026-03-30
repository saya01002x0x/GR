import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 100, // 100 User ảo
  duration: '30s',
};

// Đặt ID của artwork bạn muốn test ở đây
const ARTWORK_ID = __ENV.ARTWORK_ID || 'id-anh-nao-do-trong-db';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || null;

export default function () {
  // 1. Xem ảnh (Tăng View qua Redis)
  const viewRes = http.get(`http://localhost:5145/artworks/${ARTWORK_ID}`);
  check(viewRes, {
    'View success': (r) => r.status === 200,
  });
  sleep(1);
  
  // 2. Like ảnh (Đẩy Job vào BullMQ) - Yêu cầu auth token
  if (AUTH_TOKEN) {
    const likeRes = http.post(
      `http://localhost:5145/artworks/${ARTWORK_ID}/like`,
      null,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    check(likeRes, {
      'Like success': (r) => r.status === 200 || r.status === 201,
    });
  }
  
  sleep(2);
}
