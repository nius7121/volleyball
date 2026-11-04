// 9인제 배구 경기 엔진. 화면이나 서버에 의존하지 않는 순수 로직이다.
// nextRally()가 랠리 전체를 미리 계산하고, commitRally()가 결과를 점수에 반영한다.

import { calculateVolleyballStats } from './paps.js';
import { FORMATS, RULES, SLOT_BY_ID } from './constants.js';
import { ATTACK_VS_BLOCK, ATTACK_VS_DEFENSE, BLOCK_CALLOUTS, DEFENSE_CALLOUTS, SERVE_CALLOUTS, sanitizeTactics } from './tactics.js';

// 스탯 차이와 전술 상성, 운의 영향을 조정하는 값. scripts/simulate.js로 검증한다.
export const TUNING = {
  serveFault: { aggressive: 0.28, normal: 0.1, safety_floater: 0.06 },
  servePower: { aggressive: 0.55, normal: 0.14, safety_floater: -0.2 },
  secondServeFaultScale: 0.55,
  secondServePowerDrop: 0.4,
  receiveMean: 0.55,
  receiveStatScale: 0.3,
  receivePowerScale: 0.2,
  receiveNoise: 0.2,
  aceBelow: 0.17,
  statScale: 78,
  tacticBlock: 0.85,
  tacticDefense: 0.5,
  blockBase: -1.95,
  digBase: 0.95,
  attackErrorBase: 0.035,
  attackErrorPoorSet: 0.09,
  superDigBelow: 0.4,
  highlightGap: 6,
  hardDigBelow: 0.55,
  durationScale: 1.2,
};

const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const logistic = (x) => 1 / (1 + Math.exp(-x));

export function seededRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng) {
  const u = Math.max(rng(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

function weightedPick(items, weightOf, rng) {
  const weights = items.map((item) => Math.max(weightOf(item), 0.0001));
  let roll = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

const other = (key) => (key === 'A' ? 'B' : 'A');

/* ---------- 경기 생성 ---------- */

// lineup: [{ slotId, role, player }], serveOrder: [playerId], bench: [player]
function buildTeam(key, input) {
  const roster = {};
  for (const player of [...input.lineup.map((s) => s.player), ...input.bench]) {
    roster[player.id] = { ...player, stamina: 100 };
  }
  const team = {
    key,
    name: input.name,
    tactics: sanitizeTactics(input.tactics),
    roster,
    court: input.lineup.map((s) => ({ slotId: s.slotId, role: s.role, playerId: s.player.id })),
    bench: input.bench.map((p) => p.id),
    serveOrder: [...input.serveOrder],
    serveIndex: -1,
    subsUsed: 0,
    timeoutsLeft: RULES.timeoutsPerSet,
    subPartner: {},
    stats: {},
    attackLog: [],
    serveLog: [],
  };
  return team;
}

function emptyLine() {
  return { serves: 0, aces: 0, faults: 0, receives: 0, sets: 0, assists: 0, attacks: 0, kills: 0, attackErrors: 0, blocks: 0, digs: 0, superDigs: 0, points: 0 };
}

function scheduleHighlights(target, rng) {
  // 앞의 두 세트는 항상 치러지고 세트마다 최소 target점이 나므로 이 안에 잡으면 모두 일어난다.
  const pick = () => ({
    set: rng() < 0.5 ? 1 : 2,
    total: 3 + Math.floor(rng() * Math.max(1, target - 5)),
  });
  return { ace: pick(), superDig: pick(), block: pick() };
}

export function createMatch({ teamA, teamB, format = 'regular', rng = Math.random }) {
  const fmt = FORMATS[format] ?? FORMATS.regular;
  const firstServer = rng() < 0.5 ? 'A' : 'B';
  const match = {
    format: fmt.id,
    target: fmt.target,
    sideChange: fmt.sideChange,
    teams: { A: buildTeam('A', teamA), B: buildTeam('B', teamB) },
    set: 1,
    score: { A: 0, B: 0 },
    setsWon: { A: 0, B: 0 },
    setScores: [],
    serving: firstServer,
    firstServerOfSet: firstServer,
    leftTeam: 'A',
    sidesChangedThisSet: false,
    setOver: false,
    matchOver: false,
    winner: null,
    rallyCount: 0,
    highlightPlan: scheduleHighlights(fmt.target, rng),
    highlightsSeen: { ace: 0, superDig: 0, block: 0 },
    highlightsLog: [],
    lastHighlightRally: -100,
    tacticHits: { A: 0, B: 0 },
    rng,
  };
  match.teams[firstServer].serveIndex = 0;
  return match;
}

/* ---------- 경기 중 선수 조회 ---------- */

function courtPlayers(team) {
  return team.court.map((seat) => ({ ...seat, player: team.roster[seat.playerId] }));
}

function effStat(team, seat, stat) {
  const player = team.roster[seat.playerId];
  const base = calculateVolleyballStats(player.paps, player.height, seat.role)[stat];
  return base * (0.9 + (0.1 * player.stamina) / 100);
}

function tire(team, seat, amount = 1) {
  const player = team.roster[seat.playerId];
  const base = calculateVolleyballStats(player.paps, player.height, seat.role).speed;
  player.stamina = clamp(player.stamina - amount * (1.5 - base / 100), 0, 100);
}

const homeOf = (seat) => {
  const slot = SLOT_BY_ID[seat.slotId];
  return { d: slot.d, l: slot.l };
};

/* ---------- 랠리 시뮬레이션 ---------- */

export function nextRally(match) {
  const { rng } = match;
  const serveKey = match.serving;
  const recvKey = other(serveKey);
  const teams = match.teams;
  const events = [];
  const tally = [];
  const highlights = [];
  const want = dueHighlights(match);
  const scheduled = new Set(want);
  let crossings = 0;
  const attackRecords = [];
  const tacticHits = [];
  const serveRecord = { team: serveKey, risk: serveKey && teams[serveKey].tactics.serveRisk, result: 'in' };

  const count = (teamKey, playerId, field, n = 1) => tally.push({ teamKey, playerId, field, n });
  const push = (t, teamKey, seat, pos, dur, h, say, extra = {}) => {
    events.push({ t, team: teamKey, playerId: seat?.playerId ?? null, pos, dur: dur * TUNING.durationScale, h, say, ...extra });
  };
  const finish = (winner, reason, text) => ({
    events, tally, highlights, winner, reason, text, crossings, attackRecords, serveRecord, tacticHits,
    serving: serveKey, set: match.set, score: { ...match.score },
  });
  const highlight = (kind, teamKey, seat) => {
    // 컷이 잦으면 명장면 같지 않다. 보장 분이 아니면 앞 컷과 간격을 두고 한 랠리에 하나만 보여 준다.
    const tooSoon = match.rallyCount - match.lastHighlightRally < TUNING.highlightGap;
    if (!scheduled.has(kind) && (tooSoon || highlights.length > 0)) return;
    const entry = { kind, team: teamKey, playerId: seat.playerId };
    highlights.push(entry);
    events[events.length - 1].highlight = entry;
  };
  // 전술이 승부에 작용한 순간을 기록하고 방금 사건에 문구를 붙인다.
  const tacticHit = (teamKey, text) => {
    if (!text || tacticHits.some((h) => h.text === text)) return;
    const hit = { team: teamKey, text };
    tacticHits.push(hit);
    events[events.length - 1].tactic = hit;
  };
  const nameOf = (teamKey, seat) => teams[teamKey].roster[seat.playerId].name;

  /* 서브 */
  const serveTeam = teams[serveKey];
  const recvTeam = teams[recvKey];
  const serverId = serveTeam.serveOrder[Math.max(serveTeam.serveIndex, 0) % serveTeam.serveOrder.length];
  const serverSeat = serveTeam.court.find((s) => s.playerId === serverId) ?? serveTeam.court[0];
  const risk = serveTeam.tactics.serveRisk;
  const target = serveTeam.tactics.serveTarget;
  const forceAce = want.has('ace');
  let power = TUNING.servePower[risk];
  if (target === 'deep_corner') {
    power += recvTeam.tactics.defenseFormation === 'net_cover' ? 0.5 : 0;
  }

  const serveStat = effStat(serveTeam, serverSeat, 'serve');
  let faultChance = TUNING.serveFault[risk] * (1.45 - serveStat / 100);
  if (target === 'deep_corner') faultChance += 0.02;
  if (forceAce) faultChance = 0;

  const servePos = { d: 1.1, l: 0.5 + (rng() - 0.5) * 0.7 };
  count(serveKey, serverSeat.playerId, 'serves');
  tire(serveTeam, serverSeat);

  for (let attempt = 1; attempt <= RULES.serveTries; attempt += 1) {
    push('serve', serveKey, serverSeat, servePos, attempt === 1 ? 700 : 900, 0.2, attempt === 1 ? '서브' : '두 번째 서브', { attempt });
    if (rng() >= faultChance) break;

    const intoNet = rng() < 0.5;
    if (intoNet) {
      push('fault', serveKey, null, { d: 0.02, l: servePos.l }, 650, 0.35, '네트!');
    } else {
      push('fault', recvKey, null, { d: 1.18, l: rng() }, 800, 0.6, '아웃!');
    }
    if (attempt === RULES.serveTries) {
      count(serveKey, serverSeat.playerId, 'faults');
      serveRecord.result = 'fault';
      return finish(recvKey, 'doubleFault', `${nameOf(serveKey, serverSeat)} 선수의 서브가 두 번 모두 실패해 상대가 득점합니다.`);
    }
    // 9인제 규칙: 첫 서브를 실패해도 한 번 더 넣는다. 두 번째는 조심스럽게 넣는다.
    faultChance *= TUNING.secondServeFaultScale;
    power -= TUNING.secondServePowerDrop;
  }

  /* 리시브 */
  const receivers = courtPlayers(recvTeam).filter((s) => SLOT_BY_ID[s.slotId].row !== 'front');
  const receiver = pickReceiver(target, receivers, recvTeam, rng);
  const landing = { d: clamp(homeOf(receiver).d + (rng() - 0.5) * 0.2, 0.2, 0.98), l: clamp(homeOf(receiver).l + (rng() - 0.5) * 0.25, 0.03, 0.97) };
  const recvStat = effStat(recvTeam, receiver, 'receive');
  const receiveQuality = clamp(
    TUNING.receiveMean
      + ((recvStat - serveStat) / 100) * TUNING.receiveStatScale
      - power * TUNING.receivePowerScale
      + gauss(rng) * TUNING.receiveNoise,
  );

  if (forceAce || receiveQuality < TUNING.aceBelow) {
    push('ace', recvKey, null, landing, 1150, 0.55, '서비스 에이스!!');
    highlight('ace', serveKey, serverSeat);
    count(serveKey, serverSeat.playerId, 'aces');
    serveRecord.result = 'ace';
    if (target === 'deep_corner' && recvTeam.tactics.defenseFormation === 'net_cover') tacticHit(serveKey, SERVE_CALLOUTS.deepCorner);
    else if (target === 'weak_receiver') tacticHit(serveKey, SERVE_CALLOUTS.weakReceiver);
    count(serveKey, serverSeat.playerId, 'points');
    return finish(serveKey, 'ace', `${nameOf(serveKey, serverSeat)} 선수의 서비스 에이스! 리시브가 닿기도 전에 코트에 꽂힙니다.`);
  }

  push('receive', recvKey, receiver, landing, 1150, 0.55, '리시브');
  count(recvKey, receiver.playerId, 'receives');
  tire(recvTeam, receiver, 0.6);
  crossings += 1;

  /* 양 팀이 오가는 공격과 수비 */
  let side = recvKey;
  let quality = receiveQuality;
  let touches = 1;
  let maxTouches = RULES.maxTouches;
  let lastSeat = receiver;
  let lastPos = landing;
  let tossDisrupt = 0;
  if (target === 'setter_line') tossDisrupt += 0.05;
  if (risk === 'safety_floater' && recvTeam.tactics.attackStyle === 'quick_tempo') tossDisrupt += 0.14;

  for (let guard = 0; guard < 40; guard += 1) {
    const atkTeam = teams[side];
    const defKey = other(side);
    const defTeam = teams[defKey];
    const style = atkTeam.tactics.attackStyle;

    // 9인제 규칙: 공이 네트에 맞으면 터치가 한 번 더 허용되고 같은 선수가 이어받을 수 있다.
    if (quality < 0.34 && touches < maxTouches && rng() < 0.22) {
      maxTouches = RULES.maxTouchesAfterNet;
      const netPos = { d: 0.03, l: clamp(lastPos.l + (rng() - 0.5) * 0.3, 0.05, 0.95) };
      push('net', side, null, netPos, 650, 0.35, '네트에 맞았다!');
      const rescuer = nearest(courtPlayers(atkTeam), netPos, rng);
      if (rng() < 0.3) {
        push('drop', side, null, { d: 0.12, l: netPos.l }, 450, 0.05, '놓쳤다!');
        return finish(defKey, 'netBallDrop', `${atkTeam.name}이(가) 네트에 맞은 공을 살리지 못합니다.`);
      }
      push('netSave', side, rescuer, { d: 0.14, l: netPos.l }, 480, 0.3, '네트 플레이!');
      count(side, rescuer.playerId, 'digs');
      touches += 1;
      lastSeat = rescuer;
      lastPos = { d: 0.14, l: netPos.l };
      quality = clamp(0.38 + gauss(rng) * 0.14);
    }

    /* 토스 */
    const remaining = maxTouches - touches;
    let setQuality;
    let setter = null;
    if (remaining >= 2) {
      setter = pickSetter(atkTeam, lastSeat, rng);
      const hasRealSetter = setter.role === 'S';
      const tossStat = effStat(atkTeam, setter, 'toss');
      setQuality = clamp(
        quality * 0.6 + (tossStat / 100) * 0.3 + 0.2 - (hasRealSetter ? 0 : 0.14) - tossDisrupt + gauss(rng) * 0.12,
      );
      const disrupted = tossDisrupt > 0 && setQuality < 0.45;
      tossDisrupt = 0;
      const setPos = { d: 0.17, l: clamp(0.5 + (homeOf(setter).l - 0.5) * 0.4, 0.2, 0.8) };
      if (setQuality < 0.1 && rng() < 0.45) {
        push('set', side, setter, setPos, 800, 0.8, '토스');
        count(side, setter.playerId, 'attackErrors');
        return finish(defKey, 'ballHandling', `${nameOf(side, setter)} 선수의 토스가 흔들리며 공을 살리지 못합니다.`);
      }
      push('set', side, setter, setPos, 800, 0.8, hasRealSetter ? '토스' : '임시 세터 토스');
      if (disrupted) {
        tacticHit(serveKey, risk === 'safety_floater' && style === 'quick_tempo' ? SERVE_CALLOUTS.floaterQuick : SERVE_CALLOUTS.setterLine);
      }
      count(side, setter.playerId, 'sets');
      tire(atkTeam, setter, 0.6);
      touches += 1;
      lastSeat = setter;
      lastPos = setPos;
    } else {
      // 블로킹 터치까지 세면 터치가 모자란다. 토스 없이 바로 넘겨야 한다.
      setQuality = clamp(quality * 0.45 + 0.08);
    }

    /* 공이 나쁘면 강타 대신 넘겨 준다 */
    if (setQuality < 0.24 && rng() < 0.65) {
      const passer = setter ?? lastSeat;
      const overPos = { d: 0.5 + rng() * 0.4, l: rng() };
      const catcher = nearest(courtPlayers(defTeam), overPos, rng);
      push('freeball', defKey, catcher, overPos, 1150, 0.9, '찬스볼', { from: passer.playerId });
      count(defKey, catcher.playerId, 'receives');
      crossings += 1;
      side = defKey;
      quality = clamp(0.74 + gauss(rng) * 0.12);
      touches = 1;
      maxTouches = RULES.maxTouches;
      lastSeat = catcher;
      lastPos = overPos;
      continue;
    }

    /* 공격 */
    const attacker = pickAttacker(atkTeam, style, lastSeat, setter === null, rng);
    const spikeStat = effStat(atkTeam, attacker, 'spike');
    const attackPos = { d: style === 'back_row' && SLOT_BY_ID[attacker.slotId].row !== 'front' ? 0.3 : 0.1, l: clamp(homeOf(attacker).l, 0.08, 0.92) };
    push('attack', side, attacker, attackPos, style === 'quick_tempo' ? 430 : 700, style === 'quick_tempo' ? 0.75 : 1.15, style === 'delayed_time' ? '페인트' : '스파이크!');
    count(side, attacker.playerId, 'attacks');
    const record = { team: side, style, row: SLOT_BY_ID[attacker.slotId].row, playerId: attacker.playerId, result: 'dug' };
    attackRecords.push(record);
    tire(atkTeam, attacker, 1.1);
    touches += 1;

    const assistSeat = setter;
    const scoreKill = (reason, text, highlightKind) => {
      record.result = 'kill';
      count(side, attacker.playerId, 'kills');
      count(side, attacker.playerId, 'points');
      if (assistSeat) count(side, assistSeat.playerId, 'assists');
      if (highlightKind) highlight(highlightKind, side, attacker);
      return finish(side, reason, text);
    };

    /* 공격 범실 */
    let errorChance = TUNING.attackErrorBase + (1 - setQuality) * TUNING.attackErrorPoorSet;
    if (style === 'quick_tempo' && setQuality < 0.5) errorChance += 0.05;
    if (style === 'ace_open') errorChance -= 0.01;
    if (!want.has('block') && !want.has('superDig') && rng() < errorChance) {
      const out = rng() < 0.6;
      if (out) push('out', defKey, null, { d: 1.16, l: rng() }, 380, 0.3, '아웃!');
      else push('net', side, null, { d: 0.03, l: attackPos.l }, 300, 0.2, '네트!');
      count(side, attacker.playerId, 'attackErrors');
      record.result = 'error';
      return finish(defKey, 'attackError', `${nameOf(side, attacker)} 선수의 공격이 ${out ? '라인을 벗어납니다' : '네트에 걸립니다'}.`);
    }

    /* 블로킹 */
    const blockSystem = defTeam.tactics.blockSystem;
    const blockTactic = ATTACK_VS_BLOCK[style][blockSystem];
    const frontRow = courtPlayers(defTeam).filter((s) => SLOT_BY_ID[s.slotId].row === 'front');
    const blockStat = frontRow.reduce((sum, s) => sum + effStat(defTeam, s, 'block'), 0) / frontRow.length;
    const blockChance = logistic(
      TUNING.blockBase
        + (blockStat - spikeStat) / TUNING.statScale
        - blockTactic * TUNING.tacticBlock
        - (style === 'back_row' ? 0.3 : 0)
        - (style === 'quick_tempo' ? 0.25 : 0)
        + (style === 'ace_open' ? 0.15 : 0)
        + (1 - setQuality) * 0.9,
    );
    const mainBlocker = nearest(frontRow, attackPos, rng);
    const blockPos = { d: 0.04, l: attackPos.l };

    if (want.has('block') || rng() < blockChance) {
      const roll = want.has('block') ? 0 : rng();
      tire(defTeam, mainBlocker, 0.8);
      if (roll < 0.34) {
        push('blockKill', defKey, mainBlocker, blockPos, 260, 1.05, '블로킹!!', { slam: true });
        push('ground', side, null, { d: 0.25 + rng() * 0.2, l: attackPos.l }, 330, 0, '');
        highlight('block', defKey, mainBlocker);
        count(defKey, mainBlocker.playerId, 'blocks');
        count(defKey, mainBlocker.playerId, 'points');
        count(side, attacker.playerId, 'attackErrors');
        record.result = 'block';
        if (blockTactic < 0) tacticHit(defKey, BLOCK_CALLOUTS[`${style}:${blockSystem}`]);
        return finish(defKey, 'block', `${nameOf(defKey, mainBlocker)} 선수의 철벽 블로킹! ${nameOf(side, attacker)} 선수의 공격을 막아 냅니다.`);
      }
      if (roll < 0.56) {
        push('blockTouch', defKey, mainBlocker, blockPos, 260, 1.05, '블록 아웃');
        push('out', side, null, { d: 1.15, l: rng() }, 500, 0.6, '');
        return scoreKill('tool', `${nameOf(side, attacker)} 선수가 블로킹을 맞혀 밖으로 내보냅니다.`);
      }
      if (roll < 0.68) {
        // 블로킹에 맞고 되돌아온 공을 공격 팀이 다시 받는다.
        push('blockTouch', defKey, mainBlocker, blockPos, 260, 1.05, '원터치!');
        const coverPos = { d: 0.3 + rng() * 0.2, l: attackPos.l };
        const coverer = nearest(courtPlayers(atkTeam), coverPos, rng, attacker.playerId);
        if (rng() < 0.42) {
          push('ground', side, null, coverPos, 420, 0, '');
          record.result = 'block';
          return finish(defKey, 'coverFail', `블로킹에 맞은 공이 ${atkTeam.name} 코트에 떨어집니다.`);
        }
        push('dig', side, coverer, coverPos, 420, 0.5, '커버!');
        count(side, coverer.playerId, 'digs');
        tire(atkTeam, coverer, 0.8);
        quality = clamp(0.48 + gauss(rng) * 0.16);
        touches = 1;
        maxTouches = RULES.maxTouches;
        lastSeat = coverer;
        lastPos = coverPos;
        continue;
      }
      // 9인제 규칙: 블로킹 터치도 한 번으로 센다. 남은 터치가 두 번뿐이다.
      push('blockTouch', defKey, mainBlocker, blockPos, 260, 1.05, '원터치!');
      const softPos = { d: 0.4 + rng() * 0.35, l: clamp(attackPos.l + (rng() - 0.5) * 0.4, 0.05, 0.95) };
      const softDigger = nearest(courtPlayers(defTeam), softPos, rng, mainBlocker.playerId);
      const softDigChance = logistic(1.2 + (effStat(defTeam, softDigger, 'receive') - spikeStat * 0.8) / TUNING.statScale);
      crossings += 1;
      if (rng() >= softDigChance) {
        push('ground', defKey, null, softPos, 520, 0, '');
        return scoreKill('softBlockDrop', `블로킹에 맞은 공이 ${defTeam.name} 코트에 떨어집니다. ${nameOf(side, attacker)} 선수의 득점!`);
      }
      push('dig', defKey, softDigger, softPos, 520, 0.6, '디그');
      count(defKey, softDigger.playerId, 'digs');
      tire(defTeam, softDigger, 0.8);
      side = defKey;
      quality = clamp(0.5 + gauss(rng) * 0.16);
      touches = 2;
      maxTouches = RULES.maxTouches;
      lastSeat = softDigger;
      lastPos = softPos;
      continue;
    }

    /* 디그 */
    crossings += 1;
    const landingSpot = {
      d: style === 'delayed_time' ? 0.3 + rng() * 0.25 : 0.4 + rng() * 0.55,
      l: 0.05 + rng() * 0.9,
    };
    const digger = pickDigger(defTeam, landingSpot, rng);
    const digStat = effStat(defTeam, digger, 'receive');
    const defenseTactic = ATTACK_VS_DEFENSE[style][defTeam.tactics.defenseFormation];
    const longRallyPressure = Math.min(crossings, 14) * 0.12;
    const digChance = logistic(
      TUNING.digBase
        + (digStat - spikeStat) / TUNING.statScale
        - defenseTactic * TUNING.tacticDefense
        - (setQuality - 0.5) * 1.5
        - longRallyPressure,
    );
    const forcedSuperDig = want.has('superDig');
    if (forcedSuperDig || rng() < digChance) {
      want.delete('superDig');
      const isSuper = forcedSuperDig || digChance < TUNING.superDigBelow;
      push('dig', defKey, digger, landingSpot, 420, 0.1, isSuper ? '슬라이딩 디그!!' : '디그', { sliding: isSuper });
      // 강타와 깊은 수비처럼 상성 차이가 작은 경우는 평범한 디그까지 전술 적중으로 치지 않는다.
      if (style === 'delayed_time' && defenseTactic < 0) {
        tacticHit(defKey, DEFENSE_CALLOUTS.coverStopsFeint);
      } else if (defenseTactic < 0 && digChance < TUNING.hardDigBelow) {
        tacticHit(defKey, DEFENSE_CALLOUTS.deepStopsPower);
      }
      if (isSuper) {
        highlight('superDig', defKey, digger);
        count(defKey, digger.playerId, 'superDigs');
      }
      count(defKey, digger.playerId, 'digs');
      tire(defTeam, digger, 0.9);
      side = defKey;
      quality = clamp((isSuper ? 0.34 : 0.32 + digChance * 0.42) + gauss(rng) * 0.15);
      touches = 1;
      maxTouches = RULES.maxTouches;
      lastSeat = digger;
      lastPos = landingSpot;
      continue;
    }

    push('ground', defKey, null, landingSpot, 400, 0, '');
    if (blockTactic > 0) tacticHit(side, BLOCK_CALLOUTS[`${style}:${blockSystem}`]);
    else if (style === 'delayed_time' && defenseTactic > 0) tacticHit(side, DEFENSE_CALLOUTS.feintBeatsDeep);
    else if (defenseTactic > 0 && digChance > 1 - TUNING.hardDigBelow) tacticHit(side, DEFENSE_CALLOUTS.powerBeatsCover);
    const longRally = crossings >= 4;
    return scoreKill(
      'kill',
      longRally
        ? `${crossings}번을 오간 긴 랠리! 마지막은 ${nameOf(side, attacker)} 선수의 스파이크로 끝납니다.`
        : `${nameOf(side, attacker)} 선수의 스파이크가 코트에 꽂힙니다!`,
    );
  }

  // 이론상 도달하지 않는 안전장치
  return finish(side, 'kill', '긴 공방 끝에 득점합니다.');
}

function dueHighlights(match) {
  const due = new Set();
  const total = match.score.A + match.score.B;
  for (const [kind, plan] of Object.entries(match.highlightPlan)) {
    if (match.highlightsSeen[kind] > 0) continue;
    if (match.set > plan.set || (match.set === plan.set && total >= plan.total)) due.add(kind);
  }
  // 에이스는 랠리 시작에서 끝나므로 다른 명장면과 겹치지 않게 먼저 처리한다.
  if (due.has('ace')) return new Set(['ace']);
  return due;
}

function pickReceiver(target, receivers, team, rng) {
  if (target === 'weak_receiver' && rng() < 0.65) {
    return receivers.reduce((worst, s) => (effStat(team, s, 'receive') < effStat(team, worst, 'receive') ? s : worst));
  }
  if (target === 'deep_corner' && rng() < 0.7) {
    const corners = receivers.filter((s) => s.slotId === 'BL' || s.slotId === 'BR');
    if (corners.length) return corners[Math.floor(rng() * corners.length)];
  }
  if (target === 'setter_line' && rng() < 0.7) {
    const nearSetter = receivers.filter((s) => s.role === 'S' || s.slotId === 'MC' || s.slotId === 'BC');
    if (nearSetter.length) return nearSetter[Math.floor(rng() * nearSetter.length)];
  }
  return receivers[Math.floor(rng() * receivers.length)];
}

function nearest(seats, pos, rng, excludeId = null) {
  const pool = seats.filter((s) => s.playerId !== excludeId);
  return pool.reduce((best, seat) => {
    const home = homeOf(seat);
    const dist = Math.hypot(home.d - pos.d, home.l - pos.l) + rng() * 0.08;
    return dist < best.dist ? { seat, dist } : best;
  }, { seat: pool[0], dist: Infinity }).seat;
}

function pickDigger(team, pos, rng) {
  const seats = courtPlayers(team).filter((s) => SLOT_BY_ID[s.slotId].row !== 'front');
  return nearest(seats, pos, rng);
}

function pickSetter(team, lastSeat, rng) {
  const seats = courtPlayers(team);
  const eligible = seats.filter((s) => s.playerId !== lastSeat.playerId);
  const setters = eligible.filter((s) => s.role === 'S');
  if (setters.length) return setters[Math.floor(rng() * setters.length)];
  // 세터가 공을 받았거나 없으면 가장 가까운 선수 중 토스가 나은 선수가 임시 세터가 된다.
  return eligible.reduce((best, s) => (effStat(team, s, 'toss') > effStat(team, best, 'toss') ? s : best));
}

function pickAttacker(team, style, lastSeat, isDirectHit, rng) {
  const seats = courtPlayers(team).filter((s) => s.playerId !== lastSeat.playerId);
  return weightedPick(seats, (seat) => {
    const row = SLOT_BY_ID[seat.slotId].row;
    let weight = { WS: 3.2, MB: 2, S: 0.15, DS: 0.3 }[seat.role];
    weight *= { front: 1.6, mid: 0.55, back: 0.3 }[row];
    if (style === 'quick_tempo' && seat.role === 'MB') weight *= 2.2;
    if (style === 'back_row' && row !== 'front') weight *= 4.5;
    if (isDirectHit) weight = 1;
    const spike = effStat(team, seat, 'spike');
    if (style === 'ace_open') return weight * (spike / 60) ** 4;
    return weight * (spike / 60) ** 2;
  }, rng);
}

/* ---------- 결과 반영 ---------- */

export function commitRally(match, rally) {
  const winner = rally.winner;
  match.score[winner] += 1;
  match.rallyCount += 1;

  for (const { teamKey, playerId, field, n } of rally.tally) {
    const lines = match.teams[teamKey].stats;
    lines[playerId] ??= emptyLine();
    lines[playerId][field] += n;
  }
  for (const entry of rally.highlights) {
    match.highlightsSeen[entry.kind] += 1;
    match.highlightsLog.push({ ...entry, set: match.set });
    match.lastHighlightRally = match.rallyCount;
  }

  for (const record of rally.attackRecords) {
    const log = match.teams[record.team].attackLog;
    log.push({ ...record, set: match.set });
    if (log.length > 60) log.shift();
  }
  match.teams[rally.serveRecord.team].serveLog.push(rally.serveRecord);
  for (const hit of rally.tacticHits) match.tacticHits[hit.team] += 1;

  if (winner !== match.serving) {
    match.serving = winner;
    match.teams[winner].serveIndex += 1;
  }

  // 마지막 세트 코트 교대 (단축형 8점, 정규형 11점)
  const isDecider = match.setsWon.A === RULES.setsToWin - 1 && match.setsWon.B === RULES.setsToWin - 1;
  let changedSides = false;
  if (isDecider && !match.sidesChangedThisSet && match.score[winner] >= match.sideChange) {
    match.leftTeam = other(match.leftTeam);
    match.sidesChangedThisSet = true;
    changedSides = true;
  }

  const { A, B } = match.score;
  const lead = Math.abs(A - B);
  const top = Math.max(A, B);
  if (top >= match.target && lead >= 2) {
    const setWinner = A > B ? 'A' : 'B';
    match.setsWon[setWinner] += 1;
    match.setScores.push({ set: match.set, A, B, winner: setWinner });
    match.setOver = true;
    if (match.setsWon[setWinner] >= RULES.setsToWin) {
      match.matchOver = true;
      match.winner = setWinner;
    }
  }
  return { changedSides, setOver: match.setOver, matchOver: match.matchOver };
}

export function startNextSet(match) {
  match.set += 1;
  match.score = { A: 0, B: 0 };
  match.setOver = false;
  match.sidesChangedThisSet = false;
  // 규칙: 세트가 끝나면 코트를 바꾼다. 서브권은 세트마다 번갈아 갖고, 서브 순서는 이어간다.
  match.leftTeam = other(match.leftTeam);
  match.firstServerOfSet = other(match.firstServerOfSet);
  match.serving = match.firstServerOfSet;
  match.teams[match.serving].serveIndex += 1;
  for (const team of Object.values(match.teams)) {
    team.subsUsed = 0;
    team.subPartner = {};
    team.timeoutsLeft = RULES.timeoutsPerSet;
    recover(team, 25);
  }
}

export function recover(team, amount) {
  for (const player of Object.values(team.roster)) {
    player.stamina = clamp(player.stamina + amount, 0, 100);
  }
}

/* ---------- 감독 조작 ---------- */

export function canSubstitute(team, outId, inId) {
  if (team.subsUsed >= RULES.subsPerSet) return `이번 세트 교체 ${RULES.subsPerSet}회를 모두 썼습니다.`;
  if (!team.court.some((s) => s.playerId === outId)) return '코트에 없는 선수입니다.';
  if (!team.bench.includes(inId)) return '벤치에 없는 선수입니다.';
  const outPartner = team.subPartner[outId];
  const inPartner = team.subPartner[inId];
  if (outPartner && outPartner !== inId) return '이번 세트에 교체된 선수는 처음 교체한 선수와만 다시 바꿀 수 있습니다.';
  if (inPartner && inPartner !== outId) return '이번 세트에 교체된 선수는 처음 교체한 선수와만 다시 바꿀 수 있습니다.';
  return null;
}

export function applySubstitution(team, outId, inId) {
  const error = canSubstitute(team, outId, inId);
  if (error) return error;
  const seat = team.court.find((s) => s.playerId === outId);
  seat.playerId = inId;
  team.serveOrder = team.serveOrder.map((id) => (id === outId ? inId : id));
  team.bench = team.bench.map((id) => (id === inId ? outId : id));
  team.subPartner[outId] = inId;
  team.subPartner[inId] = outId;
  team.subsUsed += 1;
  return null;
}

// 프리 포지션이므로 코트 안의 자리와 역할은 쉬는 시간에 바꿀 수 있다. 서브 순서는 그대로 둔다.
export function applyArrangement(team, seats) {
  const current = new Set(team.court.map((s) => s.playerId));
  const incoming = new Set(seats.map((s) => s.playerId));
  if (incoming.size !== current.size || [...incoming].some((id) => !current.has(id))) {
    return '코트 선수를 바꾸려면 교체를 사용해야 합니다.';
  }
  team.court = seats.map((s) => ({ slotId: s.slotId, role: s.role, playerId: s.playerId }));
  return null;
}

/* ---------- 기록 요약 ---------- */

export function pickMvp(match) {
  let best = null;
  for (const team of Object.values(match.teams)) {
    for (const [playerId, line] of Object.entries(team.stats)) {
      const score = line.points * 3 + line.digs + line.superDigs * 3 + line.assists + line.receives * 0.3
        + (match.winner === team.key ? 3 : 0) - line.attackErrors - line.faults;
      if (!best || score > best.score) best = { playerId, teamKey: team.key, score };
    }
  }
  return best && { playerId: best.playerId, teamKey: best.teamKey };
}
