// 개발용 실행: 화면은 vite(5173)가 내려주고 이 서버는 WebSocket만 맡는다.
process.env.NODE_ENV = 'development';
await import('./index.js');
