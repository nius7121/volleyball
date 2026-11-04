import React, { useEffect, useMemo, useRef, useState } from 'react';
import PoseFigure from '../components/PoseFigure';
import { Countdown, TEAM_COLOR } from '../components/ui';
import { RULES, SLOT_BY_ID } from '../../shared/constants.js';
import { sound } from '../utils/audio';

const PLANE = { insetX: 6.5, insetY: 9 };

// 팀 기준 좌표(d: 네트에서 거리, l: 왼쪽~오른쪽)를 코트 위 %로 바꾼다.
function toScreen(team, pos, leftTeam) {
  const isLeft = team === leftTeam;
  // 엔드라인 밖 서브와 아웃 공도 화면 안에 보이도록 바깥쪽을 제한한다.
  const depth = Math.min(pos.d, 1.05);
  const planeX = isLeft ? 50 - depth * 50 : 50 + depth * 50;
  const planeY = isLeft ? pos.l * 100 : (1 - pos.l) * 100;
  return {
    x: PLANE.insetX + (planeX / 100) * (100 - PLANE.insetX * 2),
    y: PLANE.insetY + (planeY / 100) * (100 - PLANE.insetY * 2),
  };
}

const SFX = {
  serve: () => sound.playWhistle(), receive: () => sound.playDig(), dig: () => sound.playDig(), set: () => sound.playToss(),
  attack: () => sound.playSpike(), blockKill: () => sound.playBlock(), blockTouch: () => sound.playBlock(),
  ace: () => sound.playSpike(), ground: () => sound.playDig(), freeball: () => sound.playToss(), netSave: () => sound.playDig(),
};

// 사건별 동작 그림과 만화 칸 글자
const ACTION = {
  serve: { pose: 'serve', word: '슈웅!', label: '서브', air: 0 },
  receive: { pose: 'receive', word: '탁!', label: '리시브', air: 0 },
  freeball: { pose: 'receive', word: '받았다!', label: '찬스볼', air: 0 },
  dig: { pose: 'receive', word: '퍽!', label: '디그', air: 0 },
  netSave: { pose: 'receive', word: '이어라!', label: '네트 플레이', air: 0 },
  set: { pose: 'set', word: '톡!', label: '토스', air: 0 },
  attack: { pose: 'spike', word: '콰앙!', label: '스파이크', air: 9 },
  blockKill: { pose: 'block', word: '막았다!!', label: '블로킹', air: 7 },
  blockTouch: { pose: 'block', word: '닿았다!', label: '블로킹 터치', air: 7 },
};

const NO_PLAYER_WORD = {
  fault: { word: '아깝다!', label: '서브 범실' },
  net: { word: '네트!', label: '공이 네트에 맞음' },
  out: { word: '아웃!', label: '라인 밖' },
  drop: { word: '놓쳤다!', label: '공을 놓침' },
  ace: { word: '슈욱!!', label: '서비스 에이스' },
};

function actionOf(event) {
  if (event.t === 'dig' && event.sliding) return { pose: 'dig', word: '살렸다!!', label: '슬라이딩 디그', air: 0 };
  if (event.t === 'attack' && event.say === '페인트') return { pose: 'spike', word: '살짝!', label: '페인트', air: 9 };
  return ACTION[event.t] ?? null;
}

/* 랠리 재생: 서버가 보낸 사건을 시간 순서대로 코트와 만화 칸에 보여 준다 */
function useRallyPlayback(rally, inRally, ballRef, shadowRef, leftTeam) {
  const [overrides, setOverrides] = useState({});
  const [panel, setPanel] = useState(null);
  const [chain, setChain] = useState([]);
  const [callout, setCallout] = useState(null);
  const [cutIn, setCutIn] = useState(null);
  const [impact, setImpact] = useState(null);
  const [shake, setShake] = useState(0);
  const playedRef = useRef(null);
  const frameRef = useRef(null);
  const timersRef = useRef([]);

  useEffect(() => {
    if (!inRally) setOverrides({});
  }, [inRally]);

  // 마지막 사건의 컷은 랠리가 끝나는 순간과 겹친다. 랠리 타이머와 따로 두어 반드시 닫히게 한다.
  useEffect(() => {
    if (!cutIn) return undefined;
    const timer = setTimeout(() => setCutIn(null), cutIn.ms);
    return () => clearTimeout(timer);
  }, [cutIn]);

  // 전술 적중 문구는 읽을 시간만 보여 주고 치운다.
  useEffect(() => {
    if (!callout) return undefined;
    const timer = setTimeout(() => setCallout(null), 3800 / (rally?.speed || 1));
    return () => clearTimeout(timer);
  }, [callout, rally?.speed]);

  useEffect(() => {
    if (!rally || !inRally || playedRef.current === rally.id) return undefined;
    playedRef.current = rally.id;
    const receivedAt = performance.now() - (rally.elapsed ?? 0);
    const speed = rally.speed || 1;
    const timers = timersRef.current;
    setChain([]);

    // 사건별 시간표
    let clock = 0;
    const plan = rally.events.map((event) => {
      const start = clock;
      const arrive = start + event.dur / speed;
      clock = arrive + (event.highlight ? 1800 / speed : 0);
      return { event, start, arrive, end: clock, screen: toScreen(event.team, event.pos, leftTeam) };
    });

    const now = performance.now() - receivedAt;
    plan.forEach(({ event, start, arrive, screen }, index) => {
      if (arrive < now) return;
      const action = actionOf(event);
      const key = `${rally.id}_${index}`;

      // 공이 날아가는 동안 선수가 그 자리로 움직이며 동작을 시작한다.
      if (event.playerId && action) {
        timers.push(setTimeout(() => {
          setOverrides((prev) => {
            const next = {};
            for (const [id, value] of Object.entries(prev)) next[id] = { ...value, pose: 'ready', air: 0 };
            next[event.playerId] = { team: event.team, pos: event.pos, dur: event.dur / speed, pose: action.pose, air: action.air };
            return next;
          });
          setPanel({ key, team: event.team, playerId: event.playerId, ...action });
        }, Math.max(0, start - now)));
      }

      timers.push(setTimeout(() => {
        SFX[event.t]?.();
        const label = action?.label ?? NO_PLAYER_WORD[event.t]?.label;
        if (label) setChain((c) => [...c.slice(-5), { key, label, team: event.team }]);
        if (!action && NO_PLAYER_WORD[event.t]) {
          setPanel({ key, team: event.team, playerId: null, ...NO_PLAYER_WORD[event.t] });
        }
        if (['attack', 'blockKill', 'blockTouch', 'ace', 'ground'].includes(event.t)) {
          setImpact({ key, x: screen.x, y: screen.y, big: event.t !== 'ground' });
        }
        if (event.t === 'blockKill' || event.t === 'ace' || event.t === 'ground') setShake((n) => n + 1);
        if (event.tactic) setCallout({ key, ...event.tactic });
        if (event.highlight) {
          sound.playCheer();
          setCutIn({ ...event.highlight, id: key, ms: 1800 / speed });
        }
      }, arrive - now));
    });

    // 공 움직임은 매 프레임 직접 그린다.
    const draw = () => {
      const t = performance.now() - receivedAt;
      const index = plan.findIndex((p) => t < p.end);
      if (index < 0) return;
      const current = plan[index];
      const from = index === 0 ? current.screen : plan[index - 1].screen;
      const u = current.arrive === current.start ? 1 : Math.min(1, Math.max(0, (t - current.start) / (current.arrive - current.start)));
      const x = from.x + (current.screen.x - from.x) * u;
      const y = from.y + (current.screen.y - from.y) * u;
      const lift = current.event.h * 4 * u * (1 - u) * 13;
      if (ballRef.current) {
        ballRef.current.style.left = `${x}%`;
        ballRef.current.style.top = `${y - lift}%`;
        ballRef.current.style.transform = `translate(-50%, -50%) scale(${1 + lift * 0.018})`;
      }
      if (shadowRef.current) {
        shadowRef.current.style.left = `${x}%`;
        shadowRef.current.style.top = `${y}%`;
      }
      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      timers.forEach(clearTimeout);
      timersRef.current = [];
      playedRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rally?.id, inRally, leftTeam]);

  return { overrides, panel, chain, callout, cutIn, impact, shake };
}

/* 코트 */
function Court({ match, ballRef, shadowRef, overrides, impact, shake, callout }) {
  const { leftTeam } = match;
  const serverId = match.teams[match.serving].serverId;

  // 랠리가 없을 때는 공을 서버 손에 둔다.
  useEffect(() => {
    if (match.inRally) return;
    const screen = toScreen(match.serving, { d: 1.05, l: 0.5 }, leftTeam);
    if (ballRef.current) {
      ballRef.current.style.left = `${screen.x}%`;
      ballRef.current.style.top = `${screen.y - 3}%`;
      ballRef.current.style.transform = 'translate(-50%, -50%)';
    }
    if (shadowRef.current) {
      shadowRef.current.style.left = `${screen.x}%`;
      shadowRef.current.style.top = `${screen.y}%`;
    }
  }, [match.inRally, match.serving, leftTeam, ballRef, shadowRef]);

  const courtRef = useRef(null);
  const [figureSize, setFigureSize] = useState(90);
  useEffect(() => {
    const measure = () => {
      if (courtRef.current) setFigureSize(Math.max(44, courtRef.current.clientWidth * 0.105));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <div key={shake} ref={courtRef} className={`court-floor relative aspect-[16/9.4] w-full overflow-hidden border-2 border-ink ${shake ? 'anim-shake' : ''}`}>
      {/* 코트 선 */}
      <div className="absolute border-4 border-white" style={{ left: `${PLANE.insetX}%`, right: `${PLANE.insetX}%`, top: `${PLANE.insetY}%`, bottom: `${PLANE.insetY}%` }} />
      {/* 네트 */}
      <div className="absolute bottom-[3%] left-1/2 top-[3%] w-2 -translate-x-1/2 border-x-2 border-ink bg-white" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #16161a 0 2px, transparent 2px 9px)' }} />

      {/* 선수 */}
      {['A', 'B'].flatMap((key) => match.teams[key].court.map((seat) => {
        const override = overrides[seat.id];
        const isServer = !match.inRally && seat.id === serverId;
        const home = SLOT_BY_ID[seat.slotId];
        const pos = override?.pos ?? (isServer ? { d: 1.05, l: 0.5 } : { d: home.d, l: home.l });
        const screen = toScreen(key, pos, leftTeam);
        const pose = override?.pose ?? (isServer ? 'serve' : 'ready');
        const air = override?.air ?? 0;
        return (
          <div
            key={seat.id}
            className="absolute z-10 ease-out"
            style={{ left: `${screen.x}%`, top: `${screen.y}%`, transitionProperty: 'left, top', transitionDuration: `${override ? Math.max(override.dur * 0.85, 160) : 600}ms`, transform: 'translate(-50%, -62%)' }}
          >
            <div style={{ transform: `translateY(-${air}%)`, transition: 'transform 180ms ease-out' }}>
              <PoseFigure pose={pose} appearance={seat.appearance} number={seat.number} teamColor={TEAM_COLOR[key]} flip={key !== leftTeam} size={figureSize} />
            </div>
            <span className="absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap bg-white px-1 text-[clamp(.55rem,.8vw,.85rem)] font-bold leading-tight text-ink">{seat.name}</span>
          </div>
        );
      }))}

      {/* 타격 효과 */}
      {impact && (
        <svg key={impact.key} viewBox="-50 -50 100 100" className="anim-burst absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${impact.x}%`, top: `${impact.y}%`, width: impact.big ? '11%' : '6%' }} aria-hidden="true">
          <path d="M0 -48 L9 -16 L38 -32 L20 -6 L48 4 L17 11 L27 40 L3 20 L-14 44 L-14 15 L-44 22 L-22 -2 L-42 -28 L-11 -16 Z" fill="#fff" stroke="#16161a" strokeWidth="3" />
        </svg>
      )}

      {/* 공 */}
      <div ref={shadowRef} className="absolute z-20 h-[1.6%] w-[2%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/30" />
      <div ref={ballRef} className="absolute z-30 aspect-square w-[2.6%] rounded-full border-2 border-ink bg-[#FFE14D]" style={{ backgroundImage: 'linear-gradient(35deg, transparent 42%, #1A5DBF 42% 58%, transparent 58%)' }} />

      {/* 전술 적중 문구 */}
      {callout && (
        <div key={callout.key} className="anim-slam absolute inset-x-[6%] bottom-[3%] z-40 flex items-center gap-3 border-[3px] border-ink bg-white px-3 py-1">
          <span className="shrink-0 px-2 font-display text-[clamp(.8rem,1.5vw,1.6rem)] text-white" style={{ background: TEAM_COLOR[callout.team] }}>
            {match.teams[callout.team].name} 전술 적중
          </span>
          <span className="min-w-0 font-display text-[clamp(.9rem,1.8vw,2rem)]">{callout.text}</span>
        </div>
      )}
    </div>
  );
}

/* 동작 만화 칸: 지금 공을 친 선수를 크게 보여 준다 */
function ActionPanel({ panel, chain, players, leftTeam }) {
  const ref = useRef(null);
  const [size, setSize] = useState(260);
  useEffect(() => {
    const measure = () => {
      if (ref.current) setSize(Math.min(ref.current.clientWidth * 0.94, ref.current.clientHeight * 0.74));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  const player = panel?.playerId ? players[panel.playerId] : null;
  const color = panel ? TEAM_COLOR[panel.team] : '#16161A';
  return (
    <aside className="flex min-h-[16rem] flex-col border-2 border-ink bg-white">
      <div ref={ref} className="relative min-h-0 flex-1 overflow-hidden">
        <div className="focus-lines absolute inset-0 opacity-50" />
        {panel ? (
          <div key={panel.key} className="anim-slam absolute inset-0">
            {player && (
              <div className="absolute inset-x-0 bottom-[2%] flex justify-center">
                <PoseFigure pose={panel.pose} appearance={player.appearance} number={player.number} teamColor={TEAM_COLOR[player.teamKey]} flip={player.teamKey !== leftTeam} size={size} showBall />
              </div>
            )}
            <p className="absolute left-2 top-1 font-display leading-none" style={{ color, fontSize: 'clamp(2rem, 4.2vw, 4.6rem)', WebkitTextStroke: '1.5px #16161a', transform: 'rotate(-5deg)' }}>{panel.word}</p>
            {player && <p className="absolute bottom-1 right-1 border-2 border-ink bg-white px-2 font-display text-[clamp(.85rem,1.4vw,1.5rem)]">{player.number} {player.name}</p>}
          </div>
        ) : <p className="absolute inset-0 flex items-center justify-center font-display text-3xl">곧 시작!</p>}
      </div>
      <ol className="flex min-h-[2.4rem] flex-wrap items-center gap-x-1 border-t-2 border-ink bg-paper px-2 py-1 text-[clamp(.7rem,.95vw,1rem)] font-bold">
        {chain.map((step, i) => (
          <li key={step.key} style={{ color: TEAM_COLOR[step.team] }}>{i > 0 && <span className="mr-1 text-muted">›</span>}{step.label}</li>
        ))}
      </ol>
    </aside>
  );
}

/* 명장면 컷: 흰 만화 칸이 화면을 덮는다 */
const CUT_TEXT = {
  ace: { sfx: '슈욱!!', title: '서비스 에이스', fallback: '이 서브는 못 받아!', pose: 'serve' },
  superDig: { sfx: '살렸다!!', title: '슬라이딩 슈퍼 디그', fallback: '공은 아직 안 떨어졌어!', pose: 'dig' },
  block: { sfx: '콰앙!!', title: '철벽 블로킹', fallback: '여기는 못 지나간다!', pose: 'block' },
};

function CutIn({ cutIn, player }) {
  const text = CUT_TEXT[cutIn.kind];
  if (!text || !player) return null;
  const color = TEAM_COLOR[cutIn.team];
  const size = Math.min(window.innerWidth * 0.42, window.innerHeight * 0.82);
  return (
    <div className="pointer-events-none fixed inset-0 z-[55] overflow-hidden bg-white" aria-live="polite">
      <div className="focus-lines absolute inset-0" />
      <div className="tone absolute inset-y-0 right-0 w-[42%] opacity-70" style={{ clipPath: 'polygon(28% 0, 100% 0, 100% 100%, 0 100%)' }} />
      <div className="anim-slam relative flex h-full items-center justify-center gap-[3vw] px-[5vw]">
        <div className="shrink-0" style={{ filter: `drop-shadow(10px 10px 0 ${color})` }}>
          <PoseFigure pose={text.pose} appearance={player.appearance} number={player.number} teamColor={color} size={size} showBall />
        </div>
        <div className="min-w-0">
          <p className="font-display leading-none" style={{ fontSize: 'clamp(4rem, 12vw, 12rem)', WebkitTextStroke: '2px #16161a', color, transform: 'rotate(-4deg)' }}>{text.sfx}</p>
          <p className="mt-[2vh] inline-block bg-ink px-4 py-1 font-display text-white" style={{ fontSize: 'clamp(1.4rem, 3.6vw, 3.6rem)' }}>{text.title}</p>
          <p className="mt-[2vh] font-display" style={{ fontSize: 'clamp(1.2rem, 2.6vw, 2.6rem)' }}>{player.number}번 {player.name}</p>
          <p className="mt-[1.5vh] inline-block border-[3px] border-ink bg-white px-4 py-2 text-[clamp(1rem,2vw,2rem)] font-bold">{player.catchphrase || text.fallback}</p>
        </div>
      </div>
    </div>
  );
}

/* 전광판 */
function TeamBoard({ teamKey, match, align }) {
  const team = match.teams[teamKey];
  const color = TEAM_COLOR[teamKey];
  const serving = match.serving === teamKey;
  const dots = Array.from({ length: RULES.setsToWin }, (_, i) => i < match.setsWon[teamKey]);
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-[1.5vw] ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[clamp(1.2rem,2.6vw,2.8rem)] leading-tight" style={{ color }}>{team.name}</h2>
        <p className="text-[clamp(.7rem,1.05vw,1.05rem)] font-medium">
          {serving ? <b>서브 · </b> : null}전술 적중 <b>{match.tacticHits[teamKey]}</b> · 작전타임 {team.timeoutsLeft} · 교체 {RULES.subsPerSet - team.subsUsed}
        </p>
        <div className={`mt-0.5 flex gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
          {dots.map((won, i) => <span key={i} className="h-3 w-3 border-2 border-ink" style={{ background: won ? color : '#fff' }} />)}
        </div>
      </div>
      <div className="w-[clamp(4rem,9vw,9rem)] text-center font-display text-[clamp(3rem,min(7vw,12vh),7.5rem)] leading-none tabular-nums text-white" style={{ background: color }}>
        {match.score[teamKey]}
      </div>
    </div>
  );
}

export default function MatchStage({ state, rally, send, serverNow }) {
  const { match, log } = state;
  const [muted, setMuted] = useState(false);
  const left = match.leftTeam;
  const right = left === 'A' ? 'B' : 'A';
  const brk = match.break;
  const ballRef = useRef(null);
  const shadowRef = useRef(null);
  const { overrides, panel, chain, callout, cutIn, impact, shake } = useRallyPlayback(rally, match.inRally, ballRef, shadowRef, left);

  const players = useMemo(() => {
    const map = {};
    for (const key of ['A', 'B']) for (const p of match.teams[key].court) map[p.id] = { ...p, teamKey: key };
    return map;
  }, [match.teams]);

  return (
    <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col gap-2 p-2 lg:p-3">
      <header className="sheet flex items-center gap-[1.5vw] p-2">
        <TeamBoard teamKey={left} match={match} align="left" />
        <div className="shrink-0 px-1 text-center">
          <p className="font-display text-[clamp(1rem,2vw,2.2rem)] leading-tight">{match.set}세트</p>
          <p className="text-[clamp(.65rem,1vw,1rem)] font-medium">{match.target}점 · 2세트 선승</p>
          <p className="text-[clamp(.65rem,1vw,1rem)] tabular-nums text-muted">{match.setScores.map((s) => `${s[left]}:${s[right]}`).join(' ')}</p>
        </div>
        <TeamBoard teamKey={right} match={match} align="right" />
      </header>

      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,25%)]">
        <div className="relative mx-auto w-full" style={{ maxWidth: 'calc((100vh - 16.5rem) * 1.7)' }}>
          <Court match={match} ballRef={ballRef} shadowRef={shadowRef} overrides={overrides} impact={impact} shake={shake} callout={callout} />
          {brk && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-paper/85">
              <div className="sheet px-[4vw] py-[2vw] text-center">
                <p className="font-display text-[clamp(1.4rem,3vw,3.2rem)]" style={{ color: brk.team ? TEAM_COLOR[brk.team] : undefined }}>
                  {brk.kind === 'set' ? `${match.set}세트 시작 전 휴식` : `${match.teams[brk.team].name} 작전타임`}
                </p>
                <Countdown deadline={brk.deadline} serverNow={serverNow} className="font-display text-[clamp(4rem,9vw,9rem)] leading-none" />
                <p className="mt-1 font-medium">감독이 분석판을 보고 전술을 고치는 중입니다.</p>
                <button type="button" className="btn mt-2" onClick={() => send('skipBreak')}>바로 재개</button>
              </div>
            </div>
          )}
          {match.paused && !match.inRally && !brk && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-paper/70">
              <p className="sheet px-8 py-3 font-display text-5xl">일시 정지</p>
            </div>
          )}
        </div>
        <ActionPanel panel={panel} chain={chain} players={players} leftTeam={left} />
      </div>

      <footer className="grid flex-1 gap-2 lg:grid-cols-[1fr_auto]">
        <div className="sheet h-[6.5rem] overflow-y-auto p-2" aria-live="off">
          <ul className="space-y-0.5">
            {log.slice(0, 12).map((entry, i) => (
              <li key={entry.id} className={`text-[clamp(.85rem,1.2vw,1.25rem)] ${i === 0 ? 'font-bold' : 'text-muted'}`}>
                <span className="mr-2 tabular-nums">{entry.score}</span>{entry.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap items-start gap-1.5 self-start">
          <button type="button" className="btn btn-main" onClick={() => send('setPaused', { paused: !match.paused })}>{match.paused ? '다시 진행' : '다음 공 전에 멈춤'}</button>
          {[1, 2, 4].map((speed) => (
            <button key={speed} type="button" aria-pressed={match.speed === speed} className={`btn px-3 ${match.speed === speed ? 'btn-main' : ''}`} onClick={() => send('setSpeed', { speed })}>{speed}배</button>
          ))}
          <button type="button" className="btn" onClick={() => setMuted(sound.toggleMute())}>{muted ? '소리 켜기' : '소리 끄기'}</button>
        </div>
      </footer>

      {cutIn && <CutIn key={cutIn.id} cutIn={cutIn} player={players[cutIn.playerId]} />}
    </div>
  );
}
