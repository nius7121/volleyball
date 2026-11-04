// 실제 서버에 학생 30명과 선생님이 WebSocket으로 접속해 수업 한 차시를 끝까지 돌려 본다.
// 사용법: 서버를 켠 뒤 node scripts/classroom-check.js <선생님 열쇠> [포트]

import { WebSocket } from 'ws';

const [key, port = '3000'] = process.argv.slice(2);
if (!key) throw new Error('서버 창에 나온 선생님 주소의 key 값을 넣어 주세요.');
const URL_WS = `ws://localhost:${port}/ws`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(URL_WS);
    const client = {
      ws, state: null, errors: [], token: null, rallies: 0,
      send: (action, payload = {}) => ws.send(JSON.stringify({ action, ...payload })),
    };
    ws.on('message', (raw) => {
      const m = JSON.parse(raw.toString());
      if (m.type === 'state') client.state = m.state;
      if (m.type === 'joined') client.token = m.token;
      if (m.type === 'error') client.errors.push(m.message);
      if (m.type === 'rally') client.rallies += 1;
    });
    ws.on('open', () => resolve(client));
    ws.on('error', reject);
  });
}

async function until(check, label, ms = 60000) {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > ms) throw new Error(`시간 초과: ${label}`);
    await sleep(20);
  }
}

const teacher = await connect();
teacher.send('teacherHello', { key });
await until(() => teacher.state, '선생님 접속');
const { code } = teacher.state;
console.log(`방 코드 ${code}, 선생님 접속 완료`);

const students = [];
for (let i = 1; i <= 30; i += 1) {
  const c = await connect();
  c.send('join', { code, number: i, name: `학생${i}`, pin: '1234' });
  students.push(c);
}
await until(() => students.every((s) => s.state), '학생 30명 입장');
for (const [i, s] of students.entries()) {
  s.send('saveCharacter', {
    character: {
      name: `선수${i + 1}`, number: i + 1, height: 150 + (i % 30), gender: i % 2 ? 'female' : 'male', hopePosition: ['WS', 'MB', 'S', 'DS'][i % 4],
      catchphrase: `각오 ${i + 1}`, appearance: { hairStyle: 'spiky', hairColor: '#18181B', skinTone: '#FDE68A', eyeType: 'calm' },
      paps: { shuttleRunGrade: 1 + (i % 5), standingJumpGrade: 1 + ((i + 2) % 5), gripStrengthGrade: 1 + ((i + 1) % 5), sitAndReachGrade: 3, sitUpsGrade: 2 },
    },
  });
}
await until(() => teacher.state.students.filter((s) => s.character).length === 30, '캐릭터 30개');
console.log('학생 30명 입장, 캐릭터 완료');

teacher.send('autoSplit');
await until(() => teacher.state.teams.A.playerIds.length === 15, '자동 분배');
const byId = Object.fromEntries(students.map((s) => [s.state.me.id, s]));
const managerA = byId[teacher.state.teams.A.playerIds[0]];
const managerB = byId[teacher.state.teams.B.playerIds[0]];
teacher.send('setManager', { team: 'A', studentId: managerA.state.me.id });
teacher.send('setManager', { team: 'B', studentId: managerB.state.me.id });
await until(() => teacher.state.setupProblems.length === 0, '감독 지정');
teacher.send('setFormat', { format: 'short' });
teacher.send('startTactics');
await until(() => managerA.state.manager?.draft && managerB.state.manager?.draft, '전술 단계');
console.log('감독 2명 지정, 전술 단계 시작 (A 14명, B 14명)');

/* 권한과 비공개 점검 */
const plainStudent = students.find((s) => !s.state.me.isManager);
plainStudent.send('draftTactics', { tactics: { attackStyle: 'quick_tempo' } });
plainStudent.send('startMatch');
plainStudent.send('endClass');
await until(() => plainStudent.errors.length >= 3, '권한 거부');
console.log(`일반 학생 권한 거부 확인: ${plainStudent.errors.join(' / ')}`);

managerB.send('draftTactics', { tactics: { attackStyle: 'delayed_time', serveRisk: 'aggressive' } });
await sleep(50);
const peek = JSON.stringify(managerA.state) + JSON.stringify(plainStudent.state) + JSON.stringify(teacher.state.teams);
if (peek.includes('delayed_time')) throw new Error('상대 전술이 노출됨');
const others = JSON.stringify(plainStudent.state.teammates) + JSON.stringify(managerA.state.manager.players);
if (/Grade|"height"|"gender"|"realName"|학생\d/.test(others)) throw new Error('다른 학생의 개인정보가 노출됨');
console.log('상대 전술 비공개, 다른 학생의 PAPS·키·실명 비공개 확인');

managerA.send('confirm');
managerB.send('confirm');
await until(() => teacher.state.confirmed.A && teacher.state.confirmed.B, '두 감독 확정');
teacher.send('startMatch');
await until(() => teacher.state.phase === 'match', '경기 시작');
teacher.send('setSpeed', { speed: 4 });
console.log('경기 시작 (4배속)');

/* 접속이 끊겨도 경기가 이어지고 재접속되는지 */
const dropper = students.find((s) => s !== plainStudent && s.state.myStatus === 'court');
const dropperToken = dropper.token;
const dropperName = dropper.state.me.realName;
dropper.ws.close();
await until(() => teacher.state.students.find((s) => s.realName === dropperName && !s.connected), '끊김 표시');
const before = teacher.state.match.score.A + teacher.state.match.score.B;
await until(() => teacher.state.match && teacher.state.match.score.A + teacher.state.match.score.B > before, '끊긴 뒤 경기 진행', 30000);
const back = await connect();
back.send('resume', { token: dropperToken });
await until(() => back.state?.myStatus === 'court', '재접속 복구');
console.log(`코트 선수 접속 끊김 후 경기 계속, 재접속 복구 확인 (${dropperName})`);

/* 작전타임 */
managerA.send('callTimeout');
await until(() => teacher.state.match?.break?.kind === 'timeout', '작전타임');
console.log(`작전타임 시작, 남은 작전타임 A ${teacher.state.match.teams.A.timeoutsLeft}`);
managerA.send('draftTactics', { tactics: { blockSystem: 'bunch' } });
const live = () => managerA.state.manager.live;
await until(() => live().tactics.blockSystem === 'bunch', '작전타임 전술 수정');
const outId = live().court[3].playerId;
const inId = live().bench[0];
managerA.send('sub', { outId, inId });
await until(() => live().subsUsed === 1, '교체');
console.log('감독 기기에서 전술 수정과 교체 확인');
managerA.send('breakReady');
await until(() => !teacher.state.match.break, '작전타임 종료');

/* 끝까지 진행 */
let setBreaks = 0;
const finishStart = Date.now();
let lastBreak = null;
while (teacher.state.phase !== 'finished') {
  const brk = teacher.state.match?.break;
  if (brk && brk.deadline !== lastBreak) {
    lastBreak = brk.deadline;
    if (brk.kind === 'set') {
      setBreaks += 1;
      console.log(`세트 휴식: ${teacher.state.match.setScores.map((s) => `${s.A}:${s.B}`).join(', ')}`);
    }
    managerA.send('breakReady');
    managerB.send('breakReady');
  }
  if (Date.now() - finishStart > 500000) throw new Error('경기가 끝나지 않음');
  await sleep(50);
}
const { result } = teacher.state;
console.log(`경기 종료: ${result.winner} 승, ${result.setScores.map((s) => `${s.A}:${s.B}`).join(', ')}, 랠리 신호 ${teacher.rallies}회`);
const kinds = result.highlights.reduce((a, h) => ({ ...a, [h.kind]: (a[h.kind] ?? 0) + 1 }), {});
console.log(`명장면: ${JSON.stringify(kinds)}, MVP ${result.players.find((p) => p.id === result.mvpId)?.name}`);
for (const need of ['ace', 'superDig', 'block']) if (!kinds[need]) throw new Error(`${need} 명장면 없음`);
if (setBreaks < 1) throw new Error('세트 휴식이 없었음');
await until(() => plainStudent.state.phase === 'finished', '학생 결과 화면');

/* 수업 종료 시 전부 삭제 */
teacher.send('endClass');
await until(() => teacher.state.students.length === 0 && teacher.state.code !== undefined, '수업 종료');
await sleep(100);
if (plainStudent.state?.phase && plainStudent.ws.readyState === 1) {
  const ghost = await connect();
  ghost.send('resume', { token: dropperToken });
  await sleep(100);
  if (ghost.state) throw new Error('수업 종료 후에도 옛 토큰으로 복구됨');
  ghost.ws.close();
}
console.log('수업 종료: 학생 정보 삭제, 옛 접속 토큰 무효 확인');
console.log('\n전체 흐름 통과');
process.exit(0);
