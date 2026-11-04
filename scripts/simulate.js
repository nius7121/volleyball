// 경기 엔진 검증: node scripts/simulate.js [경기 수]
// 서브만 하다 끝나는 경기가 없는지, 스탯과 전술이 결과에 얼마나 영향을 주는지 측정한다.

import { commitRally, createMatch, nextRally, seededRng, startNextSet } from '../shared/engine.js';
import { DEFAULT_TACTICS, TACTIC_OPTIONS } from '../shared/tactics.js';
import { SLOTS } from '../shared/constants.js';

const N = Number(process.argv[2]) || 2000;

function makeTeam(prefix, grade, tactics = DEFAULT_TACTICS) {
  const paps = {
    shuttleRunGrade: grade, standingJumpGrade: grade, gripStrengthGrade: grade, sitAndReachGrade: grade, sitUpsGrade: grade,
  };
  const lineup = SLOTS.map((slot, i) => ({
    slotId: slot.id,
    role: slot.role,
    player: { id: `${prefix}${i}`, name: `${prefix}${i}`, number: i + 1, paps, height: 165, position: slot.role },
  }));
  return { name: prefix, tactics, lineup, bench: [], serveOrder: lineup.map((s) => s.player.id) };
}

function playMatch(teamA, teamB, format, seed) {
  const rng = seededRng(seed);
  const match = createMatch({ teamA, teamB, format, rng });
  const rallies = [];
  while (!match.matchOver) {
    const rally = nextRally(match);
    rallies.push(rally);
    commitRally(match, rally);
    if (match.setOver && !match.matchOver) startNextSet(match);
  }
  return { match, rallies };
}

function runMany(makeA, makeB, count, format = 'regular', seedBase = 1) {
  let winsA = 0;
  const reasons = {};
  let rallyCount = 0;
  let touchTotal = 0;
  let crossingTotal = 0;
  let oneShot = 0;
  let serveWon = 0;
  let serveOnlyMatches = 0;
  let noHighlight = 0;
  const missing = { ace: 0, superDig: 0, block: 0 };
  const perMatch = { ace: 0, superDig: 0, block: 0 };
  let durationMs = 0;
  let longest = 0;
  let tacticHitTotal = 0;

  for (let i = 0; i < count; i += 1) {
    const { match, rallies } = playMatch(makeA(), makeB(), format, seedBase + i);
    if (match.winner === 'A') winsA += 1;
    tacticHitTotal += match.tacticHits.A + match.tacticHits.B;
    let withAttack = 0;
    for (const rally of rallies) {
      reasons[rally.reason] = (reasons[rally.reason] ?? 0) + 1;
      rallyCount += 1;
      const contacts = rally.events.filter((e) => e.playerId).length;
      touchTotal += contacts;
      crossingTotal += rally.crossings;
      longest = Math.max(longest, rally.crossings);
      const attacked = rally.events.some((e) => e.t === 'attack' || e.t === 'freeball');
      if (attacked) withAttack += 1; else oneShot += 1;
      if (rally.winner === rally.serving) serveWon += 1;
      durationMs += rally.events.reduce((sum, e) => sum + e.dur, 0) + 3000;
      if (rally.highlights.length) durationMs += 2000;
    }
    if (withAttack / rallies.length < 0.5) serveOnlyMatches += 1;
    const seen = match.highlightsSeen;
    for (const kind of Object.keys(missing)) {
      if (!seen[kind]) missing[kind] += 1;
      perMatch[kind] += seen[kind];
    }
    if (!seen.ace && !seen.superDig && !seen.block) noHighlight += 1;
  }

  return {
    winRateA: winsA / count, reasons, rallyCount, avgContacts: touchTotal / rallyCount, avgCrossings: crossingTotal / rallyCount,
    oneShotRate: oneShot / rallyCount, serveWinRate: serveWon / rallyCount, serveOnlyMatches, noHighlight, missing,
    perMatch: Object.fromEntries(Object.entries(perMatch).map(([k, v]) => [k, v / count])),
    avgMinutes: durationMs / count / 60000, longest, tacticHitsPerRally: tacticHitTotal / rallyCount,
  };
}

const pct = (x) => `${(x * 100).toFixed(1)}%`;

/* 1. 동등 전력 경기의 흐름 */
for (const format of ['mini', 'short', 'regular']) {
  const r = runMany(() => makeTeam('A', 3), () => makeTeam('B', 3), N, format);
  console.log(`\n[${format}] 동등 전력 ${N}경기`);
  console.log(`  A 승률 ${pct(r.winRateA)} | 평균 ${r.avgMinutes.toFixed(1)}분 | 랠리당 터치 ${r.avgContacts.toFixed(1)}회 | 평균 왕복 ${r.avgCrossings.toFixed(1)} | 최장 ${r.longest}`);
  console.log(`  전술 적중 문구 랠리당 ${r.tacticHitsPerRally.toFixed(2)}회`);
  console.log(`  서브로만 끝난 랠리 ${pct(r.oneShotRate)} | 서브 팀 득점률 ${pct(r.serveWinRate)} | 서브 위주 경기 ${r.serveOnlyMatches}건`);
  console.log(`  경기당 에이스 ${r.perMatch.ace.toFixed(1)} 슈퍼디그 ${r.perMatch.superDig.toFixed(1)} 블로킹 ${r.perMatch.block.toFixed(1)}`);
  console.log(`  명장면 빠진 경기: 에이스 ${r.missing.ace} 슈퍼디그 ${r.missing.superDig} 블로킹 ${r.missing.block} 전부 ${r.noHighlight}`);
  const reasons = Object.entries(r.reasons).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v / r.rallyCount)}`);
  console.log(`  득점 원인: ${reasons.join(', ')}`);
}

/* 2. 스탯 영향: 일부 선수의 등급 차이 */
function mixedTeam(prefix, strongCount) {
  const base = makeTeam(prefix, 3);
  base.lineup.forEach((seat, i) => {
    if (i < strongCount) {
      seat.player.paps = { shuttleRunGrade: 2, standingJumpGrade: 2, gripStrengthGrade: 2, sitAndReachGrade: 2, sitUpsGrade: 2 };
    }
  });
  return base;
}
console.log('\n[스탯 영향] 3등급 팀 대비 9명 중 N명이 2등급일 때 승률');
for (const strong of [1, 3, 5, 9]) {
  const r = runMany(() => mixedTeam('A', strong), () => makeTeam('B', 3), N, 'mini', 500000);
  console.log(`  ${strong}명 강함: ${pct(r.winRateA)}`);
}

/* 3. 전술 영향: 같은 전력에서 상성이 맞을 때와 어긋날 때 */
const withTactics = (over) => ({ ...DEFAULT_TACTICS, ...over });
console.log('\n[전술 영향] 동등 전력, A 전술 B 전술 조합별 A 승률');
const cases = [
  ['블로킹만 상성 우위', { attackStyle: 'quick_tempo', blockSystem: 'guess_commit' }, { attackStyle: 'quick_tempo', blockSystem: 'read_block' }],
  ['수비만 상성 우위', { attackStyle: 'delayed_time', defenseFormation: 'net_cover' }, { attackStyle: 'delayed_time', defenseFormation: 'deep_dig' }],
  ['공격·블로킹 모두 우위', { attackStyle: 'ace_open', blockSystem: 'bunch' }, { attackStyle: 'ace_open', blockSystem: 'guess_commit' }],
  ['서브·수비 포함 전부 우위', { attackStyle: 'quick_tempo', blockSystem: 'guess_commit', defenseFormation: 'deep_dig', serveRisk: 'aggressive', serveTarget: 'setter_line' }, { attackStyle: 'quick_tempo', blockSystem: 'read_block', defenseFormation: 'net_cover', serveRisk: 'normal', serveTarget: 'deep_corner' }],
];
for (const [label, a, b] of cases) {
  const r = runMany(() => makeTeam('A', 3, withTactics(a)), () => makeTeam('B', 3, withTactics(b)), N, 'mini', 900000);
  console.log(`  ${label}: ${pct(r.winRateA)}`);
}

/* 4. 지배 전략 점검: 상대와 나머지 전술이 무작위일 때 선택지별 승률 */
console.log('\n[균형 점검] 나머지 전술이 무작위일 때 선택지별 승률. 항상 이기는 선택이 없어야 한다');
const pickRng = seededRng(77);
const randomTactics = () => Object.fromEntries(Object.entries(TACTIC_OPTIONS).map(([cat, def]) => [cat, def.options[Math.floor(pickRng() * def.options.length)].id]));
for (const [category, def] of Object.entries(TACTIC_OPTIONS)) {
  const row = def.options.map((option) => {
    const r = runMany(
      () => makeTeam('A', 3, { ...randomTactics(), [category]: option.id }),
      () => makeTeam('B', 3, randomTactics()),
      N, 'mini', 1300000,
    );
    return `${option.id} ${pct(r.winRateA)}`;
  });
  console.log(`  ${def.title}: ${row.join(' | ')}`);
}
