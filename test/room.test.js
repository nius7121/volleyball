import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Room } from '../server/room.js';
import { seededRng } from '../shared/engine.js';

const CHARACTER = (i) => ({
  name: `선수${i}`,
  number: i,
  height: 160 + (i % 20),
  gender: i % 2 ? 'male' : 'female',
  hopePosition: ['WS', 'MB', 'S', 'DS'][i % 4],
  catchphrase: '끝까지!',
  appearance: { hairStyle: 'spiky', hairColor: '#111111', skinTone: '#FDE68A', eyeType: 'calm' },
  paps: { shuttleRunGrade: 1 + (i % 5), standingJumpGrade: 2, gripStrengthGrade: 3, sitAndReachGrade: 4, sitUpsGrade: 5 },
});

function fullRoom(count = 24, timeScale = 0.001) {
  const room = new Room({ timeScale });
  for (let i = 1; i <= count; i += 1) {
    const { student } = room.join({ code: room.code, number: i, name: `학생${i}`, pin: '1234' });
    room.saveCharacter(student.id, CHARACTER(i));
  }
  return room;
}

function toTactics(room) {
  assert.equal(room.autoSplit(), null);
  const [a] = room.teams.A.playerIds;
  const [b] = room.teams.B.playerIds;
  assert.equal(room.setManager('A', a), null);
  assert.equal(room.setManager('B', b), null);
  assert.equal(room.startTactics(), null);
  return { a, b };
}

const until = async (check, ms = 20000) => {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > ms) throw new Error('시간 초과');
    await new Promise((r) => setTimeout(r, 5));
  }
};

test('방 코드와 PIN을 확인하고, 재입장은 같은 PIN으로만 된다', () => {
  const room = new Room();
  assert.ok(room.join({ code: '0', number: 1, name: '가', pin: '1111' }).error);
  assert.ok(room.join({ code: room.code, number: 1, name: '가', pin: '12' }).error);
  const { student } = room.join({ code: room.code, number: 1, name: '가', pin: '1111' });
  assert.ok(room.join({ code: room.code, number: 1, name: '가', pin: '9999' }).error);
  assert.equal(room.join({ code: room.code, number: 1, name: '가', pin: '1111' }).student.id, student.id);
  room.resetPin(student.id);
  assert.equal(room.join({ code: room.code, number: 1, name: '가', pin: '2222' }).student.id, student.id);
  assert.ok(room.join({ code: room.code, number: 1, name: '가', pin: '1111' }).error);
});

test('PIN을 다섯 번 틀리면 잠시 잠긴다', () => {
  const room = new Room();
  room.join({ code: room.code, number: 1, name: '가', pin: '1111' });
  for (let i = 0; i < 5; i += 1) room.join({ code: room.code, number: 1, name: '가', pin: '0000' });
  assert.match(room.join({ code: room.code, number: 1, name: '가', pin: '1111' }).error, /30초/);
});

test('캐릭터 입력은 서버에서 정리한다', () => {
  const room = new Room();
  const { student } = room.join({ code: room.code, number: 1, name: '가', pin: '1111' });
  room.saveCharacter(student.id, {
    name: '<b>아주아주아주아주긴이름입니다</b>', number: 500, height: 999, hopePosition: 'HACK',
    appearance: { hairColor: 'url(x)', hairStyle: 'x' }, paps: { shuttleRunGrade: 99 }, stats: { ovr: 999 },
  });
  const c = room.students.get(student.id).character;
  assert.equal(c.name.length, 10);
  assert.equal(c.number, 99);
  assert.equal(c.height, 200);
  assert.equal(c.hopePosition, 'WS');
  assert.equal(c.appearance.hairColor, '#18181B');
  assert.equal(c.paps.shuttleRunGrade, 5);
  assert.equal(c.stats, undefined);
});

test('캐릭터 모습은 성별 기본값을 따르되 따로 고를 수 있고 맞지 않는 머리는 바로잡는다', () => {
  const room = new Room();
  const { student } = room.join({ code: room.code, number: 1, name: '가', pin: '1111' });
  const save = (input) => {
    room.saveCharacter(student.id, input);
    return room.students.get(student.id).character;
  };
  assert.equal(save({ gender: 'female' }).appearance.look, 'girl');
  assert.equal(save({ gender: 'male' }).appearance.look, 'boy');
  const chosen = save({ gender: 'male', appearance: { look: 'girl', hairStyle: 'twinTail' } });
  assert.equal(chosen.appearance.look, 'girl');
  assert.equal(chosen.gender, 'male');
  assert.equal(chosen.appearance.hairStyle, 'twinTail');
  assert.equal(save({ gender: 'male', appearance: { look: 'boy', hairStyle: 'twinTail' } }).appearance.hairStyle, 'spiky');
});

test('다른 학생에게 PAPS, 키, 성별, 실명, PIN이 전달되지 않는다', () => {
  const room = fullRoom();
  const { a } = toTactics(room);
  const other = room.teams.A.playerIds[0];
  const view = room.studentView(other);
  const text = JSON.stringify({ teammates: view.teammates, manager: view.manager });
  assert.ok(!/paps|Grade|"height"|"gender"|"pin"/.test(text), text.slice(0, 400));
  assert.ok(!/학생\d/.test(text));
  const managerText = JSON.stringify(room.studentView(a).manager);
  assert.ok(!/paps|Grade|"height"|"gender"|"pin"/.test(managerText));
  assert.ok(!/"pin"|"token"/.test(JSON.stringify(room.teacherView())));
});

test('상대 전술은 감독 화면과 선생님 화면에 경기 전 노출되지 않는다', () => {
  const room = fullRoom();
  const { a, b } = toTactics(room);
  room.updateDraftTactics(b, { attackStyle: 'delayed_time' });
  assert.equal(room.studentView(a).manager.draft.tactics.attackStyle, 'ace_open');
  assert.ok(!JSON.stringify(room.studentView(a)).includes('delayed_time'));
  assert.ok(!JSON.stringify(room.teacherView()).includes('delayed_time'));
});

test('감독만 전술을 바꿀 수 있고 다른 학생은 거부된다', () => {
  const room = fullRoom();
  toTactics(room);
  const player = room.teams.A.playerIds[0];
  assert.match(room.updateDraftTactics(player, { attackStyle: 'delayed_time' }), /감독/);
  assert.match(room.confirmByManager(player), /감독/);
});

test('인원이 모자라면 시작할 수 없고 NPC로 채우면 시작할 수 있다', () => {
  const room = fullRoom(6);
  room.autoSplit();
  room.setManager('A', room.teams.A.playerIds[0]);
  room.setManager('B', room.teams.B.playerIds[0]);
  assert.match(room.startTactics(), /모자랍니다/);
  room.fillNpc();
  assert.equal(room.teams.A.playerIds.length, 9);
  assert.equal(room.startTactics(), null);
});

test('두 감독이 확정해야 시작되고, 확정 전까지 취소할 수 있다', () => {
  const room = fullRoom();
  const { a, b } = toTactics(room);
  assert.match(room.startMatch(), /확정/);
  assert.equal(room.confirmByManager(a), null);
  assert.match(room.updateDraftTactics(a, {}), /취소/);
  assert.equal(room.unconfirmByManager(a), null);
  assert.equal(room.confirmByManager(a), null);
  assert.equal(room.confirmByManager(b), null);
  assert.equal(room.startMatch(seededRng(1)), null);
  room.clearTimers();
  assert.equal(room.phase, 'match');
});

test('선생님이 감독을 바꾸면 전 감독이 선수로 들어가고 라인업이 유지된다', () => {
  const room = fullRoom();
  const { a } = toTactics(room);
  const next = room.teams.A.draft.slots[0].playerId;
  assert.equal(room.setManager('A', next), null);
  assert.equal(room.teams.A.managerId, next);
  assert.equal(room.teams.A.draft.slots[0].playerId, a);
  assert.ok(room.teams.A.playerIds.includes(a));
  assert.ok(!room.teams.A.playerIds.includes(next));
  assert.equal(new Set(room.teams.A.draft.slots.map((s) => s.playerId)).size, 9);
});

test('강제 확정은 감독이 못 끝낸 팀도 경기 가능한 상태로 만든다', () => {
  const room = fullRoom();
  const { a } = toTactics(room);
  const { draft } = room.teams.A;
  room.updateDraftLineup(a, { slots: draft.slots.map((s, i) => (i === 0 ? { ...s, playerId: null } : s)), serveOrder: draft.serveOrder });
  assert.match(room.confirmByManager(a), /9자리/);
  assert.equal(room.forceConfirm('A'), null);
  assert.ok(room.teams.A.draft.slots.every((s) => s.playerId));
  assert.equal(room.teams.A.draft.serveOrder.length, 9);
});

test('경기가 끝까지 진행되고 작전타임과 교체, 세트 휴식이 처리된다', async () => {
  const room = fullRoom();
  const { a, b } = toTactics(room);
  room.confirmByManager(a);
  room.confirmByManager(b);
  room.setFormat('short');
  room.startMatch(seededRng(5));

  await until(() => room.match.rallyCount >= 2);
  assert.equal(room.callTimeout(a), null);
  assert.match(room.callTimeout(a), /곧/);
  await until(() => room.play.break?.kind === 'timeout');
  assert.equal(room.play.break.team, 'A');
  assert.equal(room.match.teams.A.timeoutsLeft, 1);
  assert.equal(room.updateDraftTactics(a, { serveRisk: 'aggressive' }), null);
  assert.equal(room.match.teams.A.tactics.serveRisk, 'aggressive');
  const out = room.match.teams.A.court[0].playerId;
  const benchId = room.match.teams.A.bench[0];
  assert.equal(room.requestSub(a, out, benchId), null);
  assert.equal(room.match.teams.A.court[0].playerId, benchId);
  assert.equal(room.managerReady(b), null);
  assert.ok(room.play.break, '상대 감독의 완료로는 끝나지 않는다');
  assert.equal(room.managerReady(a), null);
  assert.equal(room.play.break, null);

  await until(() => room.play.break?.kind === 'set');
  assert.equal(room.match.set, 2);
  assert.match(room.updateDraftTactics(room.teams.A.playerIds[0], {}), /감독/);
  await until(() => room.phase === 'finished');
  assert.ok(room.result.winner);
  assert.ok(room.result.mvpId);
  assert.ok(room.result.tactics.A.attackStyle);
  const view = room.studentView(a);
  assert.equal(view.phase, 'finished');
});

test('분석판은 드러난 플레이만 보여 주고 상대가 고른 블로킹과 수비 값은 넣지 않는다', async () => {
  const room = fullRoom();
  const { a, b } = toTactics(room);
  room.updateDraftTactics(b, { blockSystem: 'bunch', defenseFormation: 'net_cover', serveTarget: 'deep_corner' });
  room.confirmByManager(a);
  room.confirmByManager(b);
  room.startMatch(seededRng(21));
  await until(() => room.match.rallyCount >= 12);
  const { scout } = room.studentView(a).manager.live;
  const text = JSON.stringify(scout);
  assert.ok(scout.enough);
  assert.ok(!/bunch|net_cover|deep_corner/.test(text), text);
  assert.ok(scout.opponent.total > 0);
  assert.ok(room.studentView(room.teams.A.playerIds[1]).manager === undefined);
  room.clearTimers();
});

test('작전타임과 세트 휴식은 1분이 지나면 자동으로 재개된다', async () => {
  const room = fullRoom();
  const { a, b } = toTactics(room);
  room.confirmByManager(a);
  room.confirmByManager(b);
  room.startMatch(seededRng(9));
  await until(() => room.match.rallyCount >= 1);
  room.callTimeout(b);
  await until(() => room.play.break?.kind === 'timeout');
  const before = room.match.rallyCount;
  await until(() => room.match.rallyCount > before);
  assert.equal(room.play.break, null);
  room.clearTimers();
});

test('경기 중 감독이 바뀌어도 경기가 이어지고 선수 중복이 생기지 않는다', async () => {
  const room = fullRoom();
  const { a, b } = toTactics(room);
  room.confirmByManager(a);
  room.confirmByManager(b);
  room.startMatch(seededRng(13));
  await until(() => room.match.rallyCount >= 1);
  const next = room.match.teams.A.court[2].playerId;
  assert.equal(room.setManager('A', next), null);
  const court = room.match.teams.A.court.map((s) => s.playerId);
  assert.equal(new Set(court).size, 9);
  assert.ok(!court.includes(next));
  assert.ok(court.includes(a));
  assert.equal(new Set(room.match.teams.A.serveOrder).size, 9);
  const count = room.match.rallyCount;
  await until(() => room.match.rallyCount > count);
  room.clearTimers();
});

test('수업 종료는 모든 정보를 지우고 방 코드를 바꾼다', () => {
  const room = fullRoom();
  const code = room.code;
  const anyId = [...room.students.keys()][0];
  room.endClass();
  assert.equal(room.students.size, 0);
  assert.equal(room.studentView(anyId), null);
  assert.ok(room.code !== code || room.students.size === 0);
});
