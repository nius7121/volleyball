// 수업용 서버. 선생님 PC에서 실행하고 학생은 같은 와이파이로 접속한다.
// 정적 파일을 내려주고 WebSocket으로 방 상태를 주고받는다. 저장 기능은 일부러 없다.

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { WebSocketServer } from 'ws';
import { Room } from './room.js';

const PORT = Number(process.env.PORT) || 3000;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const IS_DEV = process.env.NODE_ENV === 'development';
const TEACHER_KEY = randomBytes(9).toString('hex');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2', '.json': 'application/json',
};

function lanAddresses() {
  const virtual = /vethernet|virtual|vmware|wsl|hyper-v|loopback|bluetooth|tailscale|zerotier/i;
  const list = [];
  for (const [name, addrs] of Object.entries(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family !== 'IPv4' || addr.internal) continue;
      list.push({ name, address: addr.address, virtual: virtual.test(name), wifi: /wi-?fi|wlan|무선/i.test(name) });
    }
  }
  list.sort((a, b) => a.virtual - b.virtual || b.wifi - a.wifi);
  return list;
}

const addresses = lanAddresses();
const studentUrls = addresses.map((a) => `http://${a.address}:${PORT}`);
const mainUrl = studentUrls[0] ?? `http://localhost:${PORT}`;
const qrSvg = await QRCode.toString(mainUrl, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });

/* ---------- 정적 파일 ---------- */

const server = createServer((req, res) => {
  if (!existsSync(ROOT)) {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('화면 파일이 없습니다. npm start로 실행해 주세요.');
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  let file = normalize(join(ROOT, pathname));
  if (file !== ROOT && !file.startsWith(ROOT + sep)) {
    res.writeHead(403).end();
    return;
  }
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(ROOT, 'index.html');
  const headers = { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' };
  if (file.endsWith('index.html')) headers['Cache-Control'] = 'no-store';
  res.writeHead(200, headers);
  createReadStream(file).pipe(res);
});

/* ---------- 접속 관리 ---------- */

const clients = new Set();
let sendPending = false;

const room = new Room({
  onChange: () => {
    if (sendPending) return;
    sendPending = true;
    setImmediate(() => {
      sendPending = false;
      broadcastState();
    });
  },
  onRally: (message) => {
    for (const client of clients) {
      if (client.role === 'teacher') send(client, { type: 'rally', rally: message });
    }
  },
});

function send(client, payload) {
  if (client.ws.readyState === client.ws.OPEN) client.ws.send(JSON.stringify(payload));
}

function viewFor(client) {
  if (client.role === 'teacher') {
    return { ...room.teacherView(), access: { mainUrl, urls: studentUrls, qrSvg } };
  }
  if (client.role === 'student') return room.studentView(client.studentId);
  return null;
}

function broadcastState() {
  for (const client of clients) {
    const view = viewFor(client);
    if (view) send(client, { type: 'state', state: view });
    else if (client.role === 'student') {
      // 수업 종료나 내보내기로 학생 정보가 지워진 경우
      client.role = null;
      client.studentId = null;
      send(client, { type: 'ended' });
    }
  }
}

function attachStudent(client, student) {
  for (const other of clients) {
    if (other !== client && other.studentId === student.id) {
      send(other, { type: 'replaced' });
      other.role = null;
      other.studentId = null;
    }
  }
  client.role = 'student';
  client.studentId = student.id;
  room.setConnected(student.id, true);
  send(client, { type: 'joined', token: student.token });
}

// 역할별로 허용된 명령. 표에 없는 명령은 무시한다.
const TEACHER_ACTIONS = {
  autoSplit: () => room.autoSplit(),
  assign: (m) => room.assign(m.studentId, m.team),
  setTeamName: (m) => room.setTeamName(m.team, m.name),
  setFormat: (m) => room.setFormat(m.format),
  setManager: (m) => room.setManager(m.team, m.studentId),
  fillNpc: () => room.fillNpc(),
  removeNpcs: (m) => room.removeNpcs(m.team),
  editStudent: (m) => room.editStudent(m.studentId, m.character),
  resetPin: (m) => room.resetPin(m.studentId),
  removeStudent: (m) => room.removeStudent(m.studentId),
  startTactics: () => room.startTactics(),
  forceConfirm: (m) => room.forceConfirm(m.team),
  backToSetup: () => room.backToSetup(),
  startMatch: () => room.startMatch(),
  setPaused: (m) => room.setPaused(m.paused),
  setSpeed: (m) => room.setSpeed(m.speed),
  skipBreak: () => room.skipBreak(),
  endClass: () => room.endClass(),
};

const STUDENT_ACTIONS = {
  saveCharacter: (id, m) => room.saveCharacter(id, m.character),
  draftLineup: (id, m) => room.updateDraftLineup(id, m),
  draftTactics: (id, m) => room.updateDraftTactics(id, m.tactics),
  confirm: (id) => room.confirmByManager(id),
  unconfirm: (id) => room.unconfirmByManager(id),
  callTimeout: (id) => room.callTimeout(id),
  sub: (id, m) => room.requestSub(id, m.outId, m.inId),
  arrange: (id, m) => room.arrange(id, m.seats),
  breakReady: (id) => room.managerReady(id),
};

function handleMessage(client, message) {
  const { action } = message;
  if (action === 'teacherHello') {
    if (message.key !== TEACHER_KEY) return '선생님 주소가 올바르지 않습니다.';
    client.role = 'teacher';
    send(client, { type: 'state', state: viewFor(client) });
    const rally = room.rallyMessage();
    if (rally) send(client, { type: 'rally', rally });
    return null;
  }
  if (action === 'join') {
    const result = room.join(message);
    if (result.error) return result.error;
    attachStudent(client, result.student);
    return null;
  }
  if (action === 'resume') {
    const student = room.studentByToken(String(message.token));
    if (!student) {
      send(client, { type: 'ended' });
      return null;
    }
    attachStudent(client, student);
    return null;
  }
  if (client.role === 'teacher' && Object.hasOwn(TEACHER_ACTIONS, action)) return TEACHER_ACTIONS[action](message);
  if (client.role === 'student' && Object.hasOwn(STUDENT_ACTIONS, action)) return STUDENT_ACTIONS[action](client.studentId, message);
  return '권한이 없습니다.';
}

const wss = new WebSocketServer({
  server,
  path: '/ws',
  maxPayload: 64 * 1024,
  verifyClient: ({ origin, req }) => {
    if (IS_DEV || !origin) return true;
    try {
      return new URL(origin).host === req.headers.host;
    } catch {
      return false;
    }
  },
});

wss.on('connection', (ws) => {
  const client = { ws, role: null, studentId: null, alive: true };
  clients.add(client);
  ws.on('pong', () => { client.alive = true; });
  ws.on('message', (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (!message || typeof message !== 'object') return;
    let error;
    try {
      error = handleMessage(client, message);
    } catch (err) {
      console.error('명령 처리 오류:', message.action, err.message);
      error = '처리 중 문제가 생겼습니다. 다시 시도해 주세요.';
    }
    if (error) send(client, { type: 'error', message: error, action: message.action });
  });
  ws.on('close', () => {
    clients.delete(client);
    if (client.studentId && ![...clients].some((c) => c.studentId === client.studentId)) {
      room.setConnected(client.studentId, false);
    }
  });
  ws.on('error', () => ws.terminate());
});

// 말없이 끊긴 기기를 찾아 접속 상태에 반영한다.
setInterval(() => {
  for (const client of clients) {
    if (!client.alive) {
      client.ws.terminate();
      continue;
    }
    client.alive = false;
    client.ws.ping();
  }
}, 15000).unref();

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`포트 ${PORT}을(를) 이미 쓰고 있습니다. 먼저 켜 둔 서버를 닫아 주세요.`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, '0.0.0.0', () => {
  const teacherUrl = `http://localhost:${IS_DEV ? 5173 : PORT}/teacher?key=${TEACHER_KEY}`;
  console.log('');
  console.log('  우리반 배구 리그 서버가 켜졌습니다.');
  console.log(`  선생님 화면: ${teacherUrl}`);
  console.log(`  학생 접속 주소: ${mainUrl}`);
  for (const url of studentUrls.slice(1)) console.log(`  (접속이 안 되면) ${url}`);
  console.log('  이 창을 닫으면 서버가 꺼지고 모든 학생 정보가 지워집니다.');
  console.log('');
  if (!process.env.NO_OPEN && !IS_DEV && process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', teacherUrl], { detached: true, stdio: 'ignore' }).unref();
  }
});
