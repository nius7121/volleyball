import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyArrangement, applySubstitution, commitRally, createMatch, nextRally, seededRng, startNextSet } from '../shared/engine.js';
import { SLOTS } from '../shared/constants.js';
import { DEFAULT_TACTICS } from '../shared/tactics.js';

const PAPS = { shuttleRunGrade: 3, standingJumpGrade: 3, gripStrengthGrade: 3, sitAndReachGrade: 3, sitUpsGrade: 3 };

function makeTeam(prefix, benchCount = 0) {
  const lineup = SLOTS.map((slot, i) => ({
    slotId: slot.id,
    role: slot.role,
    player: { id: `${prefix}${i}`, name: `${prefix}${i}`, number: i + 1, paps: PAPS, height: 165 },
  }));
  const bench = Array.from({ length: benchCount }, (_, i) => ({ id: `${prefix}b${i}`, name: `${prefix}b${i}`, number: 20 + i, paps: PAPS, height: 165 }));
  return { name: prefix, tactics: DEFAULT_TACTICS, lineup, bench, serveOrder: lineup.map((s) => s.player.id) };
}

function play(seed, format = 'regular') {
  const match = createMatch({ teamA: makeTeam('A'), teamB: makeTeam('B'), format, rng: seededRng(seed) });
  const rallies = [];
  while (!match.matchOver) {
    const rally = nextRally(match);
    rallies.push(rally);
    commitRally(match, rally);
    if (match.setOver && !match.matchOver) startNextSet(match);
  }
  return { match, rallies };
}

test('세트는 목표 점수와 2점 차로 끝나고 2세트를 먼저 따면 경기가 끝난다', () => {
  for (let seed = 1; seed <= 100; seed += 1) {
    const { match } = play(seed);
    assert.equal(Math.max(match.setsWon.A, match.setsWon.B), 2);
    for (const s of match.setScores) {
      assert.ok(Math.max(s.A, s.B) >= 21);
      assert.ok(Math.abs(s.A - s.B) >= 2);
      if (Math.max(s.A, s.B) > 21) assert.equal(Math.abs(s.A - s.B), 2);
    }
  }
});

test('공이 양 팀을 오가고 서브 팀도 공격한다', () => {
  let serveTeamAttacks = 0;
  let oneShots = 0;
  let total = 0;
  for (let seed = 1; seed <= 100; seed += 1) {
    for (const rally of play(seed).rallies) {
      total += 1;
      if (!rally.events.some((e) => ['attack', 'freeball'].includes(e.t))) oneShots += 1;
      if (rally.events.some((e) => e.t === 'attack' && e.team === rally.serving)) serveTeamAttacks += 1;
    }
  }
  assert.ok(oneShots / total < 0.1, `서브로만 끝난 랠리 ${oneShots}/${total}`);
  assert.ok(serveTeamAttacks / total > 0.2, `서브 팀 공격 ${serveTeamAttacks}/${total}`);
});

test('한 팀 터치는 3회를 넘지 않고, 공이 네트에 맞으면 4회까지 허용한다', () => {
  let sawNetExtra = false;
  for (let seed = 1; seed <= 200; seed += 1) {
    for (const rally of play(seed).rallies) {
      let side = null;
      let touches = 0;
      let net = false;
      for (const e of rally.events) {
        if (!['receive', 'dig', 'set', 'attack', 'netSave', 'freeball', 'blockTouch', 'blockKill'].includes(e.t)) {
          if (e.t === 'net') net = true;
          continue;
        }
        if (e.t === 'attack' || e.t === 'set' || e.t === 'netSave') {
          if (side !== e.team) { side = e.team; touches = 0; net = false; }
        } else if (side !== e.team || e.t === 'freeball') {
          side = e.team; touches = 0; net = false;
        } else if (e.t === 'dig' && e.say === '커버!') {
          touches = 0; net = false;
        }
        touches += 1;
        assert.ok(touches <= (net ? 4 : 3), `터치 ${touches}회 (네트 ${net}): ${rally.events.map((x) => x.t).join(',')}`);
        if (touches === 4) sawNetExtra = true;
      }
    }
  }
  assert.ok(sawNetExtra, '네트 4회 터치가 나온 랠리가 있어야 한다');
});

test('같은 선수가 네트 플레이 외에는 연속으로 공을 치지 않는다', () => {
  for (let seed = 1; seed <= 200; seed += 1) {
    for (const rally of play(seed).rallies) {
      let last = null;
      for (const e of rally.events) {
        if (!e.playerId || e.t === 'serve') { if (e.t === 'serve') last = null; continue; }
        if (e.t !== 'netSave' && !e.t.startsWith('block')) assert.notEqual(e.playerId, last, rally.events.map((x) => `${x.t}:${x.playerId}`).join(' '));
        last = e.playerId;
      }
    }
  }
});

test('명장면(에이스, 슈퍼 디그, 블로킹)이 모든 경기에 하나씩은 나온다', () => {
  for (const format of ['mini', 'short', 'regular']) {
    for (let seed = 1; seed <= 1500; seed += 1) {
      const { match } = play(seed, format);
      for (const kind of ['ace', 'superDig', 'block']) {
        assert.ok(match.highlightsSeen[kind] >= 1, `${format} seed ${seed}: ${kind} 없음`);
      }
    }
  }
});

test('11점 경기도 11점과 2점 차로 세트가 끝난다', () => {
  for (let seed = 1; seed <= 100; seed += 1) {
    for (const s of play(seed, 'mini').match.setScores) {
      assert.ok(Math.max(s.A, s.B) >= 11);
      assert.ok(Math.abs(s.A - s.B) >= 2);
    }
  }
});

test('전술 적중은 상성이 실제로 유리한 팀에 기록되고 상대 전술 값은 분석판에 없다', () => {
  let hits = 0;
  for (let seed = 1; seed <= 50; seed += 1) {
    const a = makeTeam('A');
    const b = makeTeam('B');
    a.tactics = { ...DEFAULT_TACTICS, attackStyle: 'quick_tempo', blockSystem: 'guess_commit' };
    b.tactics = { ...DEFAULT_TACTICS, attackStyle: 'quick_tempo', blockSystem: 'read_block' };
    const match = createMatch({ teamA: a, teamB: b, format: 'mini', rng: seededRng(seed) });
    while (!match.matchOver) {
      const rally = nextRally(match);
      for (const hit of rally.tacticHits) {
        hits += 1;
        if (hit.text.includes('속공이 리드') || hit.text.includes('커밋 블록이')) assert.equal(hit.team, 'A');
      }
      commitRally(match, rally);
      if (match.setOver && !match.matchOver) startNextSet(match);
    }
  }
  assert.ok(hits > 50, `전술 적중 ${hits}회`);
});

test('서브는 등록한 순서대로 넘어가고 서브권을 얻을 때만 바뀐다', () => {
  const { rallies, match } = play(11);
  assert.ok(match.rallyCount > 0);
  const order = match.teams.A.serveOrder;
  let lastServer = null;
  let lastTeam = null;
  for (const rally of rallies) {
    const serve = rally.events.find((e) => e.t === 'serve');
    if (serve.team === 'A' && lastTeam === 'A' && serve.playerId !== lastServer) {
      assert.equal(order.indexOf(serve.playerId), (order.indexOf(lastServer) + 1) % 9);
    }
    if (rally.winner !== serve.team || serve.team !== 'A') lastTeam = serve.team;
    if (serve.team === 'A') { lastServer = serve.playerId; lastTeam = 'A'; }
  }
});

test('교체는 세트당 6회이고 재입장은 처음 바꾼 선수와만 된다', () => {
  const match = createMatch({ teamA: makeTeam('A', 8), teamB: makeTeam('B'), rng: seededRng(1) });
  const team = match.teams.A;
  assert.equal(applySubstitution(team, 'A0', 'Ab0'), null);
  assert.equal(team.court.find((s) => s.slotId === 'FL').playerId, 'Ab0');
  assert.ok(team.serveOrder.includes('Ab0') && !team.serveOrder.includes('A0'));
  assert.match(applySubstitution(team, 'Ab0', 'Ab1'), /처음 교체한/);
  assert.equal(applySubstitution(team, 'Ab0', 'A0'), null);
  for (let i = 1; i <= 4; i += 1) assert.equal(applySubstitution(team, `A${i}`, `Ab${i}`), null);
  assert.match(applySubstitution(team, 'A5', 'Ab5'), /6회/);
  startNextSet(match);
  assert.equal(team.subsUsed, 0);
  assert.equal(applySubstitution(team, 'A5', 'Ab5'), null);
});

test('쉬는 시간 자리 변경은 코트 선수를 바꿀 수 없다', () => {
  const match = createMatch({ teamA: makeTeam('A', 1), teamB: makeTeam('B'), rng: seededRng(1) });
  const team = match.teams.A;
  const swapped = team.court.map((s) => ({ ...s }));
  [swapped[0].playerId, swapped[1].playerId] = [swapped[1].playerId, swapped[0].playerId];
  assert.equal(applyArrangement(team, swapped), null);
  assert.equal(team.court[0].playerId, 'A1');
  swapped[0].playerId = 'Ab0';
  assert.match(applyArrangement(team, swapped), /교체/);
});

test('세트가 끝나면 코트와 첫 서브권을 바꾼다', () => {
  const match = createMatch({ teamA: makeTeam('A'), teamB: makeTeam('B'), rng: seededRng(3) });
  const first = match.firstServerOfSet;
  const left = match.leftTeam;
  match.score = { A: 21, B: 10 };
  startNextSet(match);
  assert.notEqual(match.serving, first);
  assert.notEqual(match.leftTeam, left);
  assert.deepEqual(match.score, { A: 0, B: 0 });
});
