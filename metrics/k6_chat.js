import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8082';
const TOKEN_LIST = __ENV.TOKENS ? __ENV.TOKENS.split(',') : [];

export default function () {
  const vuIndex = (__VU - 1) % (TOKEN_LIST.length > 0 ? TOKEN_LIST.length : 1);
  const token = TOKEN_LIST.length > 0 ? TOKEN_LIST[vuIndex] : '';
  const sessionId = `k6-session-vu-${__VU}`;

  const payload = JSON.stringify({
    content: "I am feeling stressed from deadlines, can you help?",
    sessionId: sessionId
  });

  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = http.post(`${BASE_URL}/api/chat`, payload, { headers: headers });

  check(res, {
    'is status 200': (r) => r.status === 200,
    'not rate limited': (r) => r.status !== 429,
    'not 500': (r) => r.status !== 500,
  });

  sleep(0.05); // slight think time
}
