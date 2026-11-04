// 한 차시용 방 상태. 모든 데이터는 이 객체의 메모리에만 있고 프로세스가 끝나면 사라진다.
// 파일, DB, 외부 서비스에 저장하지 않는다.

import { randomBytes, randomInt } from 'node:crypto';
import {
  applyArrangement, applySubstitution, canSubstitute, commitRally, createMatch, nextRally, pickMvp, recover, startNextSet,
} from '../shared/engine.js';
import { FORMATS, HAIR_BY_LOOK, RULES, ROLE_IDS, SLOTS, TIME_LIMITS } from '../shared/constants.js';
import { calculateVolleyballStats } from '../shared/paps.js';
import { COUNTER_TIPS, DEFAULT_TACTICS, sanitizeTactics, tacticName } from '../shared/tactics.js';
import { createNpc } from '../shared/npc.js';

const POINT_PAUSE_MS = 3500;
const MAX_PIN_FAILS = 5;
const PIN_LOCK_MS = 30 * 1000;
const EYE_TYPES = ['fierce', 'sharp', 'calm', 'cat', 'glasses'];
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const clampInt = (value, lo, hi, fallback) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};
const cleanText = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const otherTeam = (key) => (key === 'A' ? 'B' : 'A');

export function sanitizeCharacter(input = {}) {
  const grade = (v) => clampInt(v, 1, 5, 3);
  const a = input.appearance ?? {};
  const gender = input.gender === 'female' ? 'female' : 'male';
  // 모습은 공개 정보이고 성별은 비공개다. 학생이 모습을 따로 고를 수 있어 서로 분리해 둔다.
  const look = a.look === 'boy' || a.look === 'girl' ? a.look : (gender === 'female' ? 'girl' : 'boy');
  const hairOptions = HAIR_BY_LOOK[look].map(([id]) => id);
  return {
    name: cleanText(input.name, 10) || '이름 없음',
    number: clampInt(input.number, 1, 99, 7),
    gender,
    height: clampInt(input.height, 130, 200, 160),
    hopePosition: ROLE_IDS.includes(input.hopePosition) ? input.hopePosition : 'WS',
    catchphrase: cleanText(input.catchphrase, 30),
    appearance: {
      look,
      hairStyle: hairOptions.includes(a.hairStyle) ? a.hairStyle : hairOptions[0],
      hairColor: COLOR_RE.test(a.hairColor) ? a.hairColor : '#18181B',
      skinTone: COLOR_RE.test(a.skinTone) ? a.skinTone : '#FDE68A',
      eyeType: EYE_TYPES.includes(a.eyeType) ? a.eyeType : 'fierce',
    },
    paps: {
      shuttleRunGrade: grade(input.paps?.shuttleRunGrade),
      standingJumpGrade: grade(input.paps?.standingJumpGrade),
      gripStrengthGrade: grade(input.paps?.gripStrengthGrade),
      sitAndReachGrade: grade(input.paps?.sitAndReachGrade),
      sitUpsGrade: grade(input.paps?.sitUpsGrade),
    },
  };
}

const statsOf = (character, role) => calculateVolleyballStats(character.paps, character.height, role);

// 다른 학생에게 보여도 되는 정보. PAPS, 키, 성별, 실명은 넣지 않는다.
function publicCharacter(id, character, role, extra = {}) {
  return {
    id,
    name: character.name,
    number: character.number,
    hopePosition: character.hopePosition,
    catchphrase: character.catchphrase,
    appearance: character.appearance,
    stats: statsOf(character, role ?? character.hopePosition),
    isNpc: Boolean(character.isNpc),
    ...extra,
  };
}

export class Room {
  constructor({ onChange = () => {}, onRally = () => {}, timeScale = 1 } = {}) {
    this.onChange = onChange;
    this.onRally = onRally;
    this.timeScale = timeScale;
    this.reset();
  }

  reset() {
    this.clearTimers();
    this.code = String(randomInt(1000, 10000));
    this.phase = 'setup';
    this.format = 'mini';
    this.students = new Map();
    this.npcs = new Map();
    this.npcCounter = 0;
    this.teams = { A: this.blankTeam('주황 팀'), B: this.blankTeam('파랑 팀') };
    this.tacticsDeadline = null;
    this.match = null;
    this.play = null;
    this.log = [];
    this.result = null;
  }

  blankTeam(name) {
    return { name, managerId: null, playerIds: [], draft: null, confirmed: false };
  }

  /* ---------- 타이머 ---------- */

  clearTimers() {
    if (this.loopTimer) clearTimeout(this.loopTimer);
    if (this.breakTimer) clearTimeout(this.breakTimer);
    this.loopTimer = null;
    this.breakTimer = null;
  }

  later(fn, ms) {
    return setTimeout(fn, ms * this.timeScale);
  }

  /* ---------- 입장 ---------- */

  join({ code, number, name, pin }) {
    if (String(code) !== this.code) return { error: '방 코드가 맞지 않습니다.' };
    const num = Number(number);
    if (!Number.isInteger(num) || num < 1 || num > 60) return { error: '번호를 다시 확인해 주세요.' };
    const realName = cleanText(name, 10);
    if (!realName) return { error: '이름을 입력해 주세요.' };
    if (!/^\d{4}$/.test(String(pin))) return { error: 'PIN은 숫자 4자리입니다.' };

    const existing = [...this.students.values()].find((s) => s.number === num && s.realName === realName);
    if (!existing) {
      const student = {
        id: `s_${randomBytes(4).toString('hex')}`,
        number: num,
        realName,
        pin: String(pin),
        token: randomBytes(16).toString('hex'),
        fails: 0,
        lockUntil: 0,
        character: null,
        connected: false,
      };
      this.students.set(student.id, student);
      this.onChange();
      return { student };
    }
    if (existing.lockUntil > Date.now()) return { error: 'PIN을 여러 번 틀렸습니다. 30초 뒤에 다시 시도해 주세요.' };
    if (existing.pin === null) {
      existing.pin = String(pin);
    } else if (existing.pin !== String(pin)) {
      existing.fails += 1;
      if (existing.fails >= MAX_PIN_FAILS) {
        existing.fails = 0;
        existing.lockUntil = Date.now() + PIN_LOCK_MS;
      }
      return { error: 'PIN이 맞지 않습니다. 잊었다면 선생님께 말씀해 주세요.' };
    }
    existing.fails = 0;
    existing.token = randomBytes(16).toString('hex');
    this.onChange();
    return { student: existing };
  }

  studentByToken(token) {
    return [...this.students.values()].find((s) => s.token === token) ?? null;
  }

  setConnected(studentId, connected) {
    const student = this.students.get(studentId);
    if (student) student.connected = connected;
    this.onChange();
  }

  saveCharacter(studentId, input) {
    const student = this.students.get(studentId);
    if (!student) return '학생을 찾을 수 없습니다.';
    if (this.phase !== 'setup') return '팀 전술이 시작되어 캐릭터를 바꿀 수 없습니다.';
    student.character = sanitizeCharacter(input);
    this.onChange();
    return null;
  }

  /* ---------- 선생님: 팀 구성 ---------- */

  characterOf(id) {
    return this.students.get(id)?.character ?? this.npcs.get(id) ?? null;
  }

  teamOfPlayer(id) {
    return ['A', 'B'].find((k) => this.teams[k].playerIds.includes(id) || this.teams[k].managerId === id) ?? null;
  }

  requireSetup() {
    return this.phase === 'setup' ? null : '팀 구성 단계에서만 할 수 있습니다.';
  }

  autoSplit() {
    const blocked = this.requireSetup();
    if (blocked) return blocked;
    const ready = [...this.students.values()].filter((s) => s.character);
    const score = (s) => statsOf(s.character, s.character.hopePosition).ovr;
    ready.sort((a, b) => score(b) - score(a));
    for (const key of ['A', 'B']) {
      this.teams[key].playerIds = [];
      this.teams[key].managerId = null;
    }
    // A B B A A B B A ... 순서로 나눠 전력 차이를 줄인다.
    ready.forEach((student, i) => {
      const cycle = i % 4;
      this.teams[cycle === 0 || cycle === 3 ? 'A' : 'B'].playerIds.push(student.id);
    });
    this.onChange();
    return null;
  }

  assign(studentId, teamKey) {
    const blocked = this.requireSetup();
    if (blocked) return blocked;
    const student = this.students.get(studentId);
    if (!student) return '학생을 찾을 수 없습니다.';
    if (teamKey && !student.character) return '캐릭터를 완성한 학생만 팀에 넣을 수 있습니다.';
    for (const team of Object.values(this.teams)) {
      team.playerIds = team.playerIds.filter((id) => id !== studentId);
      if (team.managerId === studentId) team.managerId = null;
    }
    if (teamKey) this.teams[teamKey].playerIds.push(studentId);
    this.onChange();
    return null;
  }

  setTeamName(teamKey, name) {
    const cleaned = cleanText(name, 12);
    if (!this.teams[teamKey] || !cleaned) return '팀 이름을 확인해 주세요.';
    this.teams[teamKey].name = cleaned;
    if (this.match) this.match.teams[teamKey].name = cleaned;
    this.onChange();
    return null;
  }

  setFormat(format) {
    if (!FORMATS[format]) return '경기 분량을 확인해 주세요.';
    if (this.phase === 'match') return '경기 중에는 바꿀 수 없습니다.';
    this.format = format;
    this.onChange();
    return null;
  }

  // 감독 지정. 경기 전이든 중이든 같은 함수를 쓴다. 감독은 코트에 서지 않는다.
  setManager(teamKey, studentId) {
    const team = this.teams[teamKey];
    const student = this.students.get(studentId);
    if (!team || !student) return '학생을 찾을 수 없습니다.';
    if (this.phase === 'finished') return '경기가 끝났습니다.';
    const currentTeam = this.teamOfPlayer(studentId);
    if (currentTeam && currentTeam !== teamKey) return '다른 팀 학생은 감독이 될 수 없습니다.';
    if (team.managerId === studentId) return null;
    const previous = team.managerId;

    if (this.phase === 'setup') {
      team.playerIds = team.playerIds.filter((id) => id !== studentId);
      if (previous && this.characterOf(previous)) team.playerIds.push(previous);
      team.managerId = studentId;
    } else {
      this.replaceManagerLive(teamKey, studentId, previous);
    }
    this.onChange();
    return null;
  }

  replaceManagerLive(teamKey, newId, oldId) {
    const team = this.teams[teamKey];
    let incomingId = oldId && this.characterOf(oldId) ? oldId : null;
    team.playerIds = team.playerIds.filter((id) => id !== newId);
    if (incomingId) team.playerIds.push(incomingId);

    if (this.phase === 'tactics') {
      const seat = team.draft.slots.find((s) => s.playerId === newId);
      if (seat) {
        if (!incomingId) incomingId = this.firstBenchInDraft(teamKey) ?? this.addNpcToTeam(teamKey);
        seat.playerId = incomingId;
      }
      team.draft.serveOrder = team.draft.serveOrder.map((id) => (id === newId ? incomingId : id));
    } else if (this.match) {
      const mt = this.match.teams[teamKey];
      if (incomingId) this.addToRoster(mt, incomingId);
      const seat = mt.court.find((s) => s.playerId === newId);
      if (seat) {
        if (!incomingId) incomingId = mt.bench.find((id) => id !== newId) ?? this.addNpcToMatch(teamKey);
        seat.playerId = incomingId;
        mt.serveOrder = mt.serveOrder.map((id) => (id === newId ? incomingId : id));
      }
      mt.bench = mt.bench.filter((id) => id !== newId && !mt.court.some((s) => s.playerId === id));
      if (incomingId && !mt.court.some((s) => s.playerId === incomingId) && !mt.bench.includes(incomingId)) {
        mt.bench.push(incomingId);
      }
    }
    team.managerId = newId;
    this.addLog(`${team.name} 감독이 교체되었습니다.`);
  }

  firstBenchInDraft(teamKey) {
    const team = this.teams[teamKey];
    const onCourt = new Set(team.draft.slots.map((s) => s.playerId));
    return team.playerIds.find((id) => !onCourt.has(id)) ?? null;
  }

  newNpc() {
    const npc = createNpc(this.npcCounter);
    this.npcCounter += 1;
    this.npcs.set(npc.id, npc);
    return npc.id;
  }

  addNpcToTeam(teamKey) {
    const id = this.newNpc();
    this.teams[teamKey].playerIds.push(id);
    return id;
  }

  addNpcToMatch(teamKey) {
    const id = this.addNpcToTeam(teamKey);
    this.addToRoster(this.match.teams[teamKey], id);
    return id;
  }

  addToRoster(matchTeam, id) {
    if (!matchTeam.roster[id]) matchTeam.roster[id] = { ...this.enginePlayer(id), stamina: 100 };
  }

  fillNpc() {
    const blocked = this.requireSetup();
    if (blocked) return blocked;
    for (const key of ['A', 'B']) {
      while (this.teams[key].playerIds.length < RULES.starters) this.addNpcToTeam(key);
    }
    this.onChange();
    return null;
  }

  removeNpcs(teamKey) {
    const blocked = this.requireSetup();
    if (blocked) return blocked;
    const team = this.teams[teamKey];
    team.playerIds = team.playerIds.filter((id) => !this.npcs.has(id));
    this.onChange();
    return null;
  }

  editStudent(studentId, input) {
    const student = this.students.get(studentId);
    if (!student) return '학생을 찾을 수 없습니다.';
    if (this.phase !== 'setup') return '팀 구성 단계에서만 수정할 수 있습니다.';
    student.character = sanitizeCharacter({ ...student.character, ...input });
    this.onChange();
    return null;
  }

  resetPin(studentId) {
    const student = this.students.get(studentId);
    if (!student) return '학생을 찾을 수 없습니다.';
    student.pin = null;
    student.fails = 0;
    student.lockUntil = 0;
    this.onChange();
    return null;
  }

  removeStudent(studentId) {
    if (this.phase !== 'setup') return '팀 구성 단계에서만 내보낼 수 있습니다.';
    for (const team of Object.values(this.teams)) {
      team.playerIds = team.playerIds.filter((id) => id !== studentId);
      if (team.managerId === studentId) team.managerId = null;
    }
    this.students.delete(studentId);
    this.onChange();
    return null;
  }

  /* ---------- 전술 단계 ---------- */

  setupProblems() {
    const problems = [];
    for (const key of ['A', 'B']) {
      const team = this.teams[key];
      if (!team.managerId) problems.push(`${team.name} 감독을 정해 주세요.`);
      const short = RULES.starters - team.playerIds.length;
      if (short > 0) problems.push(`${team.name} 선수가 ${short}명 모자랍니다. NPC로 채워 주세요.`);
    }
    return problems;
  }

  startTactics() {
    const blocked = this.requireSetup();
    if (blocked) return blocked;
    const problems = this.setupProblems();
    if (problems.length) return problems[0];
    for (const key of ['A', 'B']) {
      const team = this.teams[key];
      team.draft = this.recommendDraft(team.playerIds);
      team.confirmed = false;
    }
    this.phase = 'tactics';
    this.tacticsDeadline = Date.now() + TIME_LIMITS.tacticsMs;
    this.result = null;
    this.onChange();
    return null;
  }

  // 감독 화면이 비어 있지 않도록 스탯 기준 추천 라인업을 미리 채운다.
  recommendDraft(playerIds) {
    const pool = playerIds.map((id) => ({ id, character: this.characterOf(id) }));
    const taken = new Set();
    const slots = SLOTS.map((slot) => ({ slotId: slot.id, role: slot.role, playerId: null }));
    const fillOrder = ['MC', 'FC', 'FL', 'FR', 'MR', 'ML', 'BC', 'BL', 'BR'];
    const statFor = { S: 'toss', MB: 'block', WS: 'spike', DS: 'receive' };
    for (const slotId of fillOrder) {
      const seat = slots.find((s) => s.slotId === slotId);
      let best = null;
      let bestScore = -Infinity;
      for (const p of pool) {
        if (taken.has(p.id)) continue;
        const score = statsOf(p.character, seat.role)[statFor[seat.role]] + (p.character.hopePosition === seat.role ? 6 : 0);
        if (score > bestScore) {
          best = p;
          bestScore = score;
        }
      }
      seat.playerId = best.id;
      taken.add(best.id);
    }
    return {
      slots,
      serveOrder: slots.map((s) => s.playerId),
      tactics: { ...DEFAULT_TACTICS },
    };
  }

  managerTeam(studentId) {
    return ['A', 'B'].find((k) => this.teams[k].managerId === studentId) ?? null;
  }

  updateDraftLineup(studentId, { slots, serveOrder }) {
    const key = this.managerTeam(studentId);
    if (!key) return '감독만 할 수 있습니다.';
    if (this.phase !== 'tactics') return '전술 단계가 아닙니다.';
    const team = this.teams[key];
    if (team.confirmed) return '확정을 취소한 뒤 바꿔 주세요.';
    if (!Array.isArray(slots) || slots.length !== SLOTS.length) return '라인업 형식이 올바르지 않습니다.';
    const seen = new Set();
    const cleaned = [];
    for (const def of SLOTS) {
      const seat = slots.find((s) => s.slotId === def.id);
      if (!seat) return '라인업 형식이 올바르지 않습니다.';
      const playerId = seat.playerId ?? null;
      if (playerId && (!team.playerIds.includes(playerId) || seen.has(playerId))) return '이 팀 선수만 한 자리씩 넣을 수 있습니다.';
      if (playerId) seen.add(playerId);
      cleaned.push({ slotId: def.id, role: ROLE_IDS.includes(seat.role) ? seat.role : def.role, playerId });
    }
    const onCourt = cleaned.filter((s) => s.playerId).map((s) => s.playerId);
    const order = (Array.isArray(serveOrder) ? serveOrder : team.draft.serveOrder).filter((id, i, arr) => onCourt.includes(id) && arr.indexOf(id) === i);
    for (const id of onCourt) if (!order.includes(id)) order.push(id);
    team.draft.slots = cleaned;
    team.draft.serveOrder = order;
    this.onChange();
    return null;
  }

  updateDraftTactics(studentId, tactics) {
    const key = this.managerTeam(studentId);
    if (!key) return '감독만 할 수 있습니다.';
    const team = this.teams[key];
    if (this.phase === 'tactics') {
      if (team.confirmed) return '확정을 취소한 뒤 바꿔 주세요.';
      team.draft.tactics = sanitizeTactics(tactics, team.draft.tactics);
    } else if (this.phase === 'match' && this.play?.break) {
      this.match.teams[key].tactics = sanitizeTactics(tactics, this.match.teams[key].tactics);
    } else {
      return '작전타임과 세트 사이에만 바꿀 수 있습니다.';
    }
    this.onChange();
    return null;
  }

  confirmDraft(teamKey) {
    const team = this.teams[teamKey];
    if (this.phase !== 'tactics') return '전술 단계가 아닙니다.';
    if (team.draft.slots.some((s) => !s.playerId)) return '9자리를 모두 채워 주세요.';
    team.confirmed = true;
    this.onChange();
    return null;
  }

  confirmByManager(studentId) {
    const key = this.managerTeam(studentId);
    return key ? this.confirmDraft(key) : '감독만 할 수 있습니다.';
  }

  unconfirmByManager(studentId) {
    const key = this.managerTeam(studentId);
    if (!key) return '감독만 할 수 있습니다.';
    if (this.phase !== 'tactics') return '이미 경기가 시작되었습니다.';
    this.teams[key].confirmed = false;
    this.onChange();
    return null;
  }

  // 선생님의 강제 확정. 빈자리가 있으면 벤치에서 채운다.
  forceConfirm(teamKey) {
    const team = this.teams[teamKey];
    if (!team || this.phase !== 'tactics') return '전술 단계가 아닙니다.';
    for (const seat of team.draft.slots) {
      if (seat.playerId) continue;
      seat.playerId = this.firstBenchInDraft(teamKey) ?? this.addNpcToTeam(teamKey);
      team.draft.serveOrder.push(seat.playerId);
    }
    return this.confirmDraft(teamKey);
  }

  backToSetup() {
    if (this.phase !== 'tactics' && this.phase !== 'finished') return '지금은 돌아갈 수 없습니다.';
    this.phase = 'setup';
    this.tacticsDeadline = null;
    this.match = null;
    this.play = null;
    this.result = null;
    this.log = [];
    for (const team of Object.values(this.teams)) {
      team.draft = null;
      team.confirmed = false;
    }
    this.onChange();
    return null;
  }

  /* ---------- 경기 진행 ---------- */

  enginePlayer(id) {
    const c = this.characterOf(id);
    return { id, name: c.name, number: c.number, appearance: c.appearance, catchphrase: c.catchphrase, paps: c.paps, height: c.height };
  }

  startMatch(rng = Math.random) {
    if (this.phase !== 'tactics') return '전술 단계가 아닙니다.';
    if (!this.teams.A.confirmed || !this.teams.B.confirmed) return '두 감독이 모두 확정해야 시작할 수 있습니다.';
    const buildInput = (key) => {
      const team = this.teams[key];
      const onCourt = new Set(team.draft.slots.map((s) => s.playerId));
      return {
        name: team.name,
        tactics: team.draft.tactics,
        lineup: team.draft.slots.map((s) => ({ slotId: s.slotId, role: s.role, player: this.enginePlayer(s.playerId) })),
        bench: team.playerIds.filter((id) => !onCourt.has(id)).map((id) => this.enginePlayer(id)),
        serveOrder: team.draft.serveOrder,
      };
    };
    this.match = createMatch({ teamA: buildInput('A'), teamB: buildInput('B'), format: this.format, rng });
    this.phase = 'match';
    this.tacticsDeadline = null;
    this.log = [];
    this.play = {
      speed: 1,
      paused: false,
      current: null,
      rallyId: 0,
      break: null,
      pendingTimeout: null,
      queuedSubs: { A: [], B: [] },
      lastText: '',
    };
    this.addLog(`경기 시작! ${FORMATS[this.format].desc}. ${this.teams[this.match.serving].name}의 서브로 시작합니다.`);
    this.onChange();
    this.loopTimer = this.later(() => this.beginRally(), 2500);
    return null;
  }

  addLog(text) {
    const score = this.match ? `${this.match.score.A}:${this.match.score.B}` : '';
    this.log.unshift({ id: `${Date.now()}_${Math.random()}`, text, score, set: this.match?.set ?? 0 });
    this.log = this.log.slice(0, 60);
  }

  beginRally() {
    this.loopTimer = null;
    const { play, match } = this;
    if (this.phase !== 'match' || !play || play.break || play.current) return;
    if (play.pendingTimeout) {
      this.enterTimeout(play.pendingTimeout);
      return;
    }
    if (play.paused) {
      this.onChange();
      return;
    }
    const rally = nextRally(match);
    play.rallyId += 1;
    const duration = rally.events.reduce((sum, e) => sum + e.dur + (e.highlight ? 1800 : 0), 0);
    play.current = { id: play.rallyId, rally, startedAt: Date.now(), speed: play.speed, duration: duration / play.speed };
    this.onRally(this.rallyMessage());
    this.onChange();
    this.loopTimer = this.later(() => this.endRally(), duration / play.speed);
  }

  rallyMessage() {
    const current = this.play?.current;
    if (!current) return null;
    return {
      id: current.id,
      events: current.rally.events,
      serving: current.rally.serving,
      speed: current.speed,
      elapsed: Date.now() - current.startedAt,
    };
  }

  endRally() {
    this.loopTimer = null;
    const { play, match } = this;
    const { rally } = play.current;
    play.current = null;
    const outcome = commitRally(match, rally);
    play.lastText = rally.text;
    this.addLog(rally.text);
    for (const hit of rally.tacticHits) this.addLog(`전술 적중 (${this.teams[hit.team].name}): ${hit.text}`);
    if (outcome.changedSides) this.addLog('한 팀이 코트 교대 점수에 도달해 서로 코트를 바꿉니다.');
    this.applyQueuedSubs();

    if (outcome.matchOver) {
      this.finishMatch();
      return;
    }
    if (outcome.setOver) {
      this.enterSetBreak();
      return;
    }
    this.onChange();
    this.loopTimer = this.later(() => this.beginRally(), POINT_PAUSE_MS / play.speed);
  }

  applyQueuedSubs() {
    for (const key of ['A', 'B']) {
      const queue = this.play.queuedSubs[key];
      this.play.queuedSubs[key] = [];
      for (const sub of queue) this.performSub(key, sub.outId, sub.inId);
    }
  }

  performSub(teamKey, outId, inId) {
    const team = this.match.teams[teamKey];
    const error = applySubstitution(team, outId, inId);
    if (!error) {
      this.addLog(`${team.name} 교체: ${team.roster[outId].name} 선수가 나오고 ${team.roster[inId].name} 선수가 들어갑니다. (${team.subsUsed}/${RULES.subsPerSet})`);
    }
    return error;
  }

  /* 쉬는 시간: 작전타임과 세트 사이 */

  enterTimeout(teamKey) {
    const { play, match } = this;
    play.pendingTimeout = null;
    match.teams[teamKey].timeoutsLeft -= 1;
    recover(match.teams[teamKey], 12);
    this.addLog(`${match.teams[teamKey].name} 작전타임! ${TIME_LIMITS.timeoutMs / 1000}초 동안 전술을 고칩니다.`);
    this.startBreak({ kind: 'timeout', team: teamKey, ms: TIME_LIMITS.timeoutMs });
  }

  enterSetBreak() {
    const last = this.match.setScores[this.match.setScores.length - 1];
    this.addLog(`${last.set}세트 종료 ${last.A}:${last.B}. 다음 세트까지 ${TIME_LIMITS.setBreakMs / 1000}초 쉽니다.`);
    startNextSet(this.match);
    this.startBreak({ kind: 'set', team: null, ms: TIME_LIMITS.setBreakMs });
  }

  startBreak({ kind, team, ms }) {
    this.play.break = { kind, team, deadline: Date.now() + ms, ready: { A: false, B: false } };
    this.onChange();
    this.breakTimer = this.later(() => this.endBreak(), ms);
  }

  endBreak() {
    if (!this.play?.break) return;
    if (this.breakTimer) clearTimeout(this.breakTimer);
    this.breakTimer = null;
    const { kind } = this.play.break;
    this.play.break = null;
    if (kind === 'set') {
      this.addLog(`${this.match.set}세트 시작! ${this.teams[this.match.serving].name}의 서브입니다.`);
    }
    this.onChange();
    this.loopTimer = this.later(() => this.beginRally(), 1500);
  }

  managerReady(studentId) {
    const key = this.managerTeam(studentId);
    const brk = this.play?.break;
    if (!key || !brk) return '쉬는 시간이 아닙니다.';
    brk.ready[key] = true;
    // 작전타임은 부른 팀이 끝내면 재개하고, 세트 사이는 두 감독이 모두 끝내면 재개한다.
    const done = brk.kind === 'timeout' ? brk.ready[brk.team] : brk.ready.A && brk.ready.B;
    if (done) this.endBreak();
    else this.onChange();
    return null;
  }

  callTimeout(studentId) {
    const key = this.managerTeam(studentId);
    if (!key) return '감독만 할 수 있습니다.';
    if (this.phase !== 'match') return '경기 중이 아닙니다.';
    const { play } = this;
    if (play.break) return '이미 쉬는 시간입니다.';
    if (play.pendingTimeout) return '곧 작전타임이 시작됩니다.';
    if (this.match.teams[key].timeoutsLeft <= 0) return `이번 세트 작전타임 ${RULES.timeoutsPerSet}회를 모두 썼습니다.`;
    play.pendingTimeout = key;
    if (!play.current && !this.loopTimer) this.beginRally();
    else this.onChange();
    return null;
  }

  requestSub(studentId, outId, inId) {
    const key = this.managerTeam(studentId);
    if (!key) return '감독만 할 수 있습니다.';
    if (this.phase !== 'match') return '경기 중이 아닙니다.';
    const team = this.match.teams[key];
    if (this.play.break) {
      const error = this.performSub(key, outId, inId);
      if (!error) this.onChange();
      return error;
    }
    const queue = this.play.queuedSubs[key];
    if (queue.some((s) => s.outId === outId || s.inId === inId)) return '이미 신청한 선수입니다.';
    if (team.subsUsed + queue.length >= RULES.subsPerSet) return `이번 세트 교체 ${RULES.subsPerSet}회를 모두 썼습니다.`;
    const error = canSubstitute(team, outId, inId);
    if (error) return error;
    queue.push({ outId, inId });
    this.onChange();
    return null;
  }

  arrange(studentId, seats) {
    const key = this.managerTeam(studentId);
    if (!key) return '감독만 할 수 있습니다.';
    if (!this.play?.break) return '작전타임과 세트 사이에만 자리를 바꿀 수 있습니다.';
    if (!Array.isArray(seats) || seats.length !== RULES.starters) return '자리 형식이 올바르지 않습니다.';
    const slotIds = new Set(seats.map((s) => s.slotId));
    if (slotIds.size !== SLOTS.length || SLOTS.some((s) => !slotIds.has(s.id))) return '자리 형식이 올바르지 않습니다.';
    if (seats.some((s) => !ROLE_IDS.includes(s.role))) return '역할을 확인해 주세요.';
    const error = applyArrangement(this.match.teams[key], seats);
    if (!error) this.onChange();
    return error;
  }

  /* 선생님 조작 */

  setPaused(paused) {
    if (this.phase !== 'match') return '경기 중이 아닙니다.';
    const { play } = this;
    play.paused = Boolean(paused);
    this.onChange();
    if (!play.paused && !play.current && !play.break && !this.loopTimer) this.beginRally();
    return null;
  }

  setSpeed(speed) {
    if (!this.play || ![1, 2, 4].includes(speed)) return '배속을 확인해 주세요.';
    this.play.speed = speed;
    this.onChange();
    return null;
  }

  skipBreak() {
    if (!this.play?.break) return '쉬는 시간이 아닙니다.';
    this.endBreak();
    return null;
  }

  finishMatch() {
    const { match } = this;
    this.clearTimers();
    const winner = match.teams[match.winner];
    this.addLog(`경기 종료! ${winner.name} 승리!`);
    const mvp = pickMvp(match);
    this.result = {
      winner: match.winner,
      setScores: match.setScores,
      mvpId: mvp?.playerId ?? null,
      tactics: { A: match.teams.A.tactics, B: match.teams.B.tactics },
      highlights: match.highlightsLog,
      tacticHits: match.tacticHits,
      players: ['A', 'B'].flatMap((key) => {
        const team = match.teams[key];
        return Object.values(team.roster).map((p) => ({
          id: p.id,
          teamKey: key,
          name: p.name,
          number: p.number,
          appearance: p.appearance,
          catchphrase: p.catchphrase,
          line: team.stats[p.id] ?? null,
        }));
      }),
    };
    this.phase = 'finished';
    this.play.current = null;
    this.onChange();
  }

  endClass() {
    this.reset();
    this.onChange();
  }

  /* ---------- 화면별 정보 ---------- */

  publicMatch() {
    const { match, play } = this;
    if (!match) return null;
    const teamInfo = (key) => {
      const t = match.teams[key];
      return {
        key,
        name: t.name,
        timeoutsLeft: t.timeoutsLeft,
        subsUsed: t.subsUsed,
        court: t.court.map((seat) => {
          const p = t.roster[seat.playerId];
          return { slotId: seat.slotId, role: seat.role, id: p.id, name: p.name, number: p.number, appearance: p.appearance, catchphrase: p.catchphrase };
        }),
        bench: t.bench.map((id) => ({ id, name: t.roster[id].name, number: t.roster[id].number })),
        serverId: key === match.serving ? t.serveOrder[Math.max(t.serveIndex, 0) % t.serveOrder.length] : null,
      };
    };
    return {
      set: match.set,
      target: match.target,
      score: match.score,
      setsWon: match.setsWon,
      setScores: match.setScores,
      serving: match.serving,
      leftTeam: match.leftTeam,
      tacticHits: match.tacticHits,
      teams: { A: teamInfo('A'), B: teamInfo('B') },
      paused: play.paused,
      speed: play.speed,
      inRally: Boolean(play.current),
      pendingTimeout: play.pendingTimeout,
      break: play.break ? { kind: play.break.kind, team: play.break.team, deadline: play.break.deadline, ready: play.break.ready } : null,
    };
  }

  commonView() {
    return {
      phase: this.phase,
      format: this.format,
      formats: FORMATS,
      teamNames: { A: this.teams.A.name, B: this.teams.B.name },
      confirmed: { A: this.teams.A.confirmed, B: this.teams.B.confirmed },
      tacticsDeadline: this.tacticsDeadline,
      match: this.publicMatch(),
      log: this.log.slice(0, 30),
      result: this.result,
      now: Date.now(),
    };
  }

  rosterEntry(id) {
    const character = this.characterOf(id);
    return character ? publicCharacter(id, character) : null;
  }

  teacherView() {
    const students = [...this.students.values()].sort((a, b) => a.number - b.number).map((s) => ({
      id: s.id,
      number: s.number,
      realName: s.realName,
      connected: s.connected,
      pinReset: s.pin === null,
      teamKey: this.teamOfPlayer(s.id),
      isManager: Boolean(this.managerTeam(s.id)),
      character: s.character,
      stats: s.character ? statsOf(s.character, s.character.hopePosition) : null,
    }));
    const teamInfo = (key) => {
      const team = this.teams[key];
      return {
        name: team.name,
        managerId: team.managerId,
        managerName: team.managerId ? this.students.get(team.managerId)?.realName : null,
        managerConnected: team.managerId ? Boolean(this.students.get(team.managerId)?.connected) : false,
        playerIds: team.playerIds,
        npcs: team.playerIds.filter((id) => this.npcs.has(id)).map((id) => this.rosterEntry(id)),
        confirmed: team.confirmed,
      };
    };
    return {
      role: 'teacher',
      code: this.code,
      ...this.commonView(),
      students,
      teams: { A: teamInfo('A'), B: teamInfo('B') },
      setupProblems: this.phase === 'setup' ? this.setupProblems() : [],
    };
  }

  studentView(studentId) {
    const student = this.students.get(studentId);
    if (!student) return null;
    const teamKey = this.teamOfPlayer(studentId);
    const managerOf = this.managerTeam(studentId);
    const view = {
      role: 'student',
      ...this.commonView(),
      me: {
        id: student.id,
        number: student.number,
        realName: student.realName,
        character: student.character,
        stats: student.character ? statsOf(student.character, student.character.hopePosition) : null,
        teamKey,
        isManager: Boolean(managerOf),
      },
      teammates: teamKey
        ? this.teams[teamKey].playerIds.filter((id) => id !== studentId).map((id) => this.rosterEntry(id)).filter(Boolean)
        : [],
      managerName: teamKey && this.teams[teamKey].managerId ? this.characterOf(this.teams[teamKey].managerId)?.name ?? '감독' : null,
    };
    if (this.match && teamKey) {
      const mt = this.match.teams[teamKey];
      const seat = mt.court.find((s) => s.playerId === studentId);
      view.myStatus = managerOf ? 'manager' : seat ? 'court' : mt.bench.includes(studentId) ? 'bench' : 'none';
      view.mySlot = seat?.slotId ?? null;
      view.myLine = mt.stats[studentId] ?? null;
    }
    if (managerOf) view.manager = this.managerView(managerOf);
    return view;
  }

  // 분석판: 경기에서 실제로 드러난 플레이만 집계한다. 상대가 고른 전술 값을 직접 넣지 않는다.
  scoutFor(key) {
    const summarize = (log) => {
      const total = log.length;
      const rate = (result) => (total ? Math.round((log.filter((r) => r.result === result).length / total) * 100) : 0);
      return { total, killRate: rate('kill'), blockedRate: rate('block'), dugRate: rate('dug'), errorRate: rate('error') };
    };
    const opponentKey = otherTeam(key);
    const opp = this.match.teams[opponentKey];
    const mine = this.match.teams[key];
    // 전술을 바꾸면 옛 기록이 흐려지므로 최근 공격 위주로 본다.
    const recent = opp.attackLog.slice(-16);
    const styleCounts = {};
    for (const r of recent) styleCounts[r.style] = (styleCounts[r.style] ?? 0) + 1;
    const styles = Object.entries(styleCounts).sort((a, b) => b[1] - a[1]).map(([style, count]) => ({
      style,
      name: tacticName('attackStyle', style),
      share: Math.round((count / recent.length) * 100),
    }));
    const kills = {};
    for (const r of opp.attackLog) if (r.result === 'kill') kills[r.playerId] = (kills[r.playerId] ?? 0) + 1;
    const topScorers = Object.entries(kills).sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([id, count]) => ({ name: opp.roster[id]?.name ?? '선수', number: opp.roster[id]?.number, count }));
    const serves = opp.serveLog;
    const myRecent = summarize(mine.attackLog.slice(-16));
    const tips = [];
    if (recent.length >= 3 && styles[0]) tips.push(COUNTER_TIPS[styles[0].style]);
    if (myRecent.total >= 3 && myRecent.blockedRate >= 30) tips.push('우리 공격이 자주 막혀요. 공격 방식을 바꿔 보세요.');
    if (myRecent.total >= 3 && myRecent.dugRate >= 50) tips.push('우리 공격이 자주 받혀요. 페인트나 다른 공격수를 써 보세요.');
    const faults = serves.filter((s) => s.result === 'fault').length;
    const aces = serves.filter((s) => s.result === 'ace').length;
    return {
      opponent: { ...summarize(opp.attackLog), styles, topScorers, serves: serves.length, faults, aces },
      mine: myRecent,
      tacticHits: { mine: this.match.tacticHits[key], opponent: this.match.tacticHits[opponentKey] },
      tips,
      enough: recent.length >= 3,
    };
  }

  // 상대 전술은 절대 넣지 않는다.
  managerView(key) {
    const team = this.teams[key];
    const players = team.playerIds.map((id) => this.characterOf(id) && {
      ...publicCharacter(id, this.characterOf(id)),
      statsByRole: Object.fromEntries(ROLE_IDS.map((role) => [role, statsOf(this.characterOf(id), role)])),
    }).filter(Boolean);
    const view = { teamKey: key, players, confirmed: team.confirmed, draft: team.draft };
    if (this.match) {
      const mt = this.match.teams[key];
      view.live = {
        tactics: mt.tactics,
        court: mt.court,
        bench: mt.bench,
        serveOrder: mt.serveOrder,
        subsUsed: mt.subsUsed,
        subPartner: mt.subPartner,
        queuedSubs: this.play.queuedSubs[key],
        scout: this.scoutFor(key),
        timeoutsLeft: mt.timeoutsLeft,
        roster: Object.fromEntries(Object.values(mt.roster).map((p) => [p.id, {
          id: p.id,
          name: p.name,
          number: p.number,
          stamina: Math.round(p.stamina),
          statsByRole: Object.fromEntries(ROLE_IDS.map((role) => [role, calculateVolleyballStats(p.paps, p.height, role)])),
        }])),
      };
    }
    return view;
  }
}

export { otherTeam };
