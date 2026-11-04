import React, { useState } from 'react';
import { Countdown, ScoreStrip, TEAM_COLOR, useCountdown } from '../components/ui';
import { ROLES, RULES, SLOTS } from '../../shared/constants.js';
import { STAT_LABELS } from '../../shared/paps.js';
import { TACTIC_OPTIONS } from '../../shared/tactics.js';

const ROLE_STAT = { WS: 'spike', MB: 'block', S: 'toss', DS: 'receive' };

/* 전술 선택: 경기 전과 쉬는 시간에 함께 쓴다 */
function TacticsPicker({ tactics, onChange, disabled }) {
  return (
    <div className="space-y-4">
      {Object.entries(TACTIC_OPTIONS).map(([category, def]) => (
        <fieldset key={category} disabled={disabled}>
          <legend className="mb-1 font-display text-xl">{def.title}</legend>
          <div className="space-y-1.5">
            {def.options.map((option) => {
              const selected = tactics[category] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => onChange({ ...tactics, [category]: option.id })}
                  className={`block w-full border-2 border-ink p-2.5 text-left disabled:opacity-60 ${selected ? 'bg-ink text-white' : 'bg-white'}`}
                >
                  <span className="font-bold">{option.name}</span>
                  <span className="block text-sm">{option.desc}</span>
                  <span className={`block text-sm ${selected ? 'text-white' : 'text-muted'}`}>{option.tip}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

/* 3×3 코트 배치. 자리를 누른 뒤 다른 자리나 벤치 선수를 누르면 맞바꾼다. */
function LineupBoard({ seats, players, onChange, disabled, allowBench = true }) {
  const [selected, setSelected] = useState(null);
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));
  const onCourt = new Set(seats.map((s) => s.playerId));
  const bench = players.filter((p) => !onCourt.has(p.id));

  const pressSeat = (slotId) => {
    if (disabled) return;
    if (!selected) {
      setSelected({ type: 'seat', slotId });
      return;
    }
    if (selected.type === 'seat') {
      if (selected.slotId !== slotId) {
        const from = seats.find((s) => s.slotId === selected.slotId);
        const to = seats.find((s) => s.slotId === slotId);
        onChange(seats.map((s) => {
          if (s.slotId === from.slotId) return { ...s, playerId: to.playerId };
          if (s.slotId === to.slotId) return { ...s, playerId: from.playerId };
          return s;
        }));
      }
    } else {
      onChange(seats.map((s) => (s.slotId === slotId ? { ...s, playerId: selected.playerId } : s)));
    }
    setSelected(null);
  };

  const pressBench = (playerId) => {
    if (disabled) return;
    if (selected?.type === 'seat') {
      onChange(seats.map((s) => (s.slotId === selected.slotId ? { ...s, playerId } : s)));
      setSelected(null);
    } else {
      setSelected(selected?.playerId === playerId ? null : { type: 'bench', playerId });
    }
  };

  const selectedPlayer = selected?.type === 'seat'
    ? byId[seats.find((s) => s.slotId === selected.slotId)?.playerId]
    : byId[selected?.playerId];
  const selectedRole = selected?.type === 'seat' ? seats.find((s) => s.slotId === selected.slotId)?.role : selectedPlayer?.hopePosition;

  return (
    <div>
      <div className="bg-ink py-1 text-center text-sm font-bold text-white">네트</div>
      <div className="court-floor grid grid-cols-3 gap-1 border-2 border-t-0 border-ink p-1">
        {SLOTS.map((slot) => {
          const seat = seats.find((s) => s.slotId === slot.id);
          const player = byId[seat?.playerId];
          const active = selected?.type === 'seat' && selected.slotId === slot.id;
          const statKey = ROLE_STAT[seat?.role];
          return (
            <div key={slot.id} className={`bg-white p-1 ${active ? 'outline outline-4 -outline-offset-2 outline-teamB' : ''}`}>
              <button type="button" disabled={disabled} onClick={() => pressSeat(slot.id)} aria-label={`${slot.label} 자리 선택`} className="block min-h-[58px] w-full text-left">
                <span className="block text-xs text-muted">{slot.short}</span>
                {player ? (
                  <>
                    <span className="block truncate text-sm font-bold">{player.number} {player.name}</span>
                    <span className="block text-xs">{STAT_LABELS[statKey]} {player.statsByRole?.[seat.role]?.[statKey]}{player.hopePosition === seat.role ? ' · 희망' : ''}</span>
                  </>
                ) : <span className="block text-sm font-bold text-alert">비었음</span>}
              </button>
              <select
                aria-label={`${slot.label} 역할`}
                disabled={disabled}
                value={seat?.role}
                onChange={(e) => onChange(seats.map((s) => (s.slotId === slot.id ? { ...s, role: e.target.value } : s)))}
                className="min-h-[34px] border p-0.5 text-xs"
              >
                {Object.entries(ROLES).map(([id, role]) => <option key={id} value={id}>{role.name}</option>)}
              </select>
            </div>
          );
        })}
      </div>

      {selectedPlayer && (
        <p className="mt-2 border-l-4 border-ink bg-white p-2 text-sm">
          <b>{selectedPlayer.name}</b> {ROLES[selectedRole]?.name} 기준:{' '}
          {Object.entries(STAT_LABELS).map(([k, label]) => `${label} ${selectedPlayer.statsByRole?.[selectedRole]?.[k]}`).join(' · ')}
        </p>
      )}

      {allowBench && (
        <>
          <h3 className="mb-1 mt-3 text-lg">벤치 ({bench.length}명)</h3>
          {bench.length === 0 ? <p className="text-sm text-muted">벤치가 없습니다.</p> : (
            <div className="grid grid-cols-2 gap-1.5">
              {bench.map((p) => (
                <button key={p.id} type="button" disabled={disabled} onClick={() => pressBench(p.id)} aria-pressed={selected?.playerId === p.id} className={`border-2 border-ink p-2 text-left text-sm ${selected?.playerId === p.id ? 'bg-ink text-white' : 'bg-white'}`}>
                  <b>{p.number} {p.name}</b>
                  <span className="block text-xs">{ROLES[p.hopePosition]?.name} 희망</span>
                </button>
              ))}
            </div>
          )}
          <p className="mt-2 text-sm text-muted">자리를 누르고 다른 자리나 벤치 선수를 누르면 서로 바뀝니다.</p>
        </>
      )}
    </div>
  );
}

function ServeOrder({ order, names, onChange, disabled }) {
  const move = (i, delta) => {
    const next = [...order];
    [next[i], next[i + delta]] = [next[i + delta], next[i]];
    onChange(next);
  };
  return (
    <div>
      <p className="mb-2 text-sm text-muted">9인제 규칙에 따라 경기 시작 후에는 서브 순서를 바꿀 수 없습니다.</p>
      <ol className="space-y-1">
        {order.map((id, i) => (
          <li key={id} className="flex items-center gap-2 border-2 border-ink bg-white p-1.5">
            <span className="w-6 text-center font-display text-lg">{i + 1}</span>
            <span className="flex-1 truncate font-bold">{names[id]}</span>
            <button type="button" className="btn btn-small" aria-label={`${names[id]} 위로`} disabled={disabled || i === 0} onClick={() => move(i, -1)}>위</button>
            <button type="button" className="btn btn-small" aria-label={`${names[id]} 아래로`} disabled={disabled || i === order.length - 1} onClick={() => move(i, 1)}>아래</button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="grid gap-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      {tabs.map(([id, label]) => (
        <button key={id} type="button" role="tab" aria-selected={value === id} onClick={() => onChange(id)} className={`btn px-1 ${value === id ? 'btn-main' : ''}`}>{label}</button>
      ))}
    </div>
  );
}

/* 경기 전 10분 */
function PreMatch({ state, send, serverNow }) {
  const { manager, teamNames, tacticsDeadline, confirmed } = state;
  const [tab, setTab] = useState('lineup');
  const { draft, players, confirmed: locked, teamKey } = manager;
  const names = Object.fromEntries(players.map((p) => [p.id, `${p.number} ${p.name}`]));
  const hasSetter = draft.slots.some((s) => s.role === 'S' && s.playerId);
  const hasEmpty = draft.slots.some((s) => !s.playerId);
  const left = useCountdown(tacticsDeadline, serverNow);
  const opponent = teamKey === 'A' ? 'B' : 'A';

  const updateSeats = (slots) => {
    const onCourt = slots.map((s) => s.playerId).filter(Boolean);
    const order = draft.serveOrder.filter((id) => onCourt.includes(id));
    for (const id of onCourt) if (!order.includes(id)) order.push(id);
    send('draftLineup', { slots, serveOrder: order });
  };

  return (
    <div className="mx-auto max-w-lg space-y-3 px-4 py-4 pb-28">
      <header className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: TEAM_COLOR[teamKey] }}>{teamNames[teamKey]} 감독</p>
          <h1 className="text-2xl">라인업과 전술</h1>
        </div>
        <div className="text-right">
          <Countdown deadline={tacticsDeadline} serverNow={serverNow} className="font-display text-3xl" />
          {left <= 0 && <p className="text-sm font-bold text-alert">시간 종료, 곧 선생님이 확정합니다</p>}
        </div>
      </header>

      <Tabs tabs={[['lineup', '라인업'], ['order', '서브 순서'], ['tactics', '전술']]} value={tab} onChange={setTab} />

      {tab === 'lineup' && <LineupBoard seats={draft.slots} players={players} disabled={locked} onChange={updateSeats} />}
      {tab === 'order' && <ServeOrder order={draft.serveOrder} names={names} disabled={locked} onChange={(serveOrder) => send('draftLineup', { slots: draft.slots, serveOrder })} />}
      {tab === 'tactics' && <TacticsPicker tactics={draft.tactics} disabled={locked} onChange={(tactics) => send('draftTactics', { tactics })} />}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-ink bg-paper p-3">
        <div className="mx-auto max-w-lg">
          {!hasSetter && !hasEmpty && !locked && <p className="mb-1 text-sm font-bold text-alert">세터가 없습니다. 이대로 확정하면 임시 세터가 토스해서 정확도가 떨어져요.</p>}
          {hasEmpty && <p className="mb-1 text-sm font-bold text-alert">빈자리를 채워야 확정할 수 있습니다.</p>}
          {locked ? (
            <div className="flex items-center gap-2">
              <p className="flex-1 text-sm font-bold">{confirmed[opponent] ? '두 팀 모두 확정했습니다. 선생님이 경기를 시작해요.' : '확정했습니다. 상대 감독을 기다리는 중입니다.'}</p>
              <button type="button" className="btn" onClick={() => send('unconfirm')}>다시 고치기</button>
            </div>
          ) : (
            <button type="button" className={`btn w-full text-lg ${teamKey === 'A' ? 'btn-a' : 'btn-b'}`} disabled={hasEmpty} onClick={() => send('confirm')}>전술 확정</button>
          )}
        </div>
      </div>
    </div>
  );
}

function SubPanel({ live, send }) {
  const [outId, setOutId] = useState('');
  const [inId, setInId] = useState('');
  const left = RULES.subsPerSet - live.subsUsed - live.queuedSubs.length;
  const nameOf = (id) => {
    const p = live.roster[id];
    return p ? `${p.number} ${p.name}` : id;
  };
  const partner = live.subPartner[outId];
  const benchOptions = live.bench.filter((id) => (partner ? id === partner : !live.subPartner[id] || live.subPartner[id] === outId));
  return (
    <div className="sheet space-y-2 p-3">
      <h3 className="text-lg">선수 교체 <span className="font-body text-sm font-normal">이번 세트 {left}회 남음</span></h3>
      {live.bench.length === 0 ? <p className="text-sm text-muted">벤치에 선수가 없습니다.</p> : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-bold">나오는 선수
              <select value={outId} onChange={(e) => { setOutId(e.target.value); setInId(''); }} className="mt-1">
                <option value="">선택</option>
                {live.court.map((s) => <option key={s.playerId} value={s.playerId}>{nameOf(s.playerId)} (체력 {live.roster[s.playerId]?.stamina})</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold">들어가는 선수
              <select value={inId} onChange={(e) => setInId(e.target.value)} className="mt-1" disabled={!outId}>
                <option value="">선택</option>
                {benchOptions.map((id) => <option key={id} value={id}>{nameOf(id)}</option>)}
              </select>
            </label>
          </div>
          <button type="button" className="btn btn-main w-full" disabled={!outId || !inId || left <= 0} onClick={() => { send('sub', { outId, inId }); setOutId(''); setInId(''); }}>교체하기</button>
          {live.queuedSubs.map((s) => <p key={s.outId} className="text-sm font-bold">다음 공이 끝나면: {nameOf(s.outId)} → {nameOf(s.inId)}</p>)}
        </>
      )}
    </div>
  );
}

/* 분석판: 경기에서 드러난 플레이로 상대 전술을 추리한다 */
function RateBar({ label, value, color }) {
  return (
    <div className="grid grid-cols-[7.2rem_1fr_2.4rem] items-center gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <span className="h-3 border border-ink bg-paper"><span className="block h-full" style={{ width: `${value}%`, background: color }} /></span>
      <span className="text-right font-bold tabular-nums">{value}%</span>
    </div>
  );
}

function ScoutBoard({ scout, teamKey }) {
  const color = TEAM_COLOR[teamKey];
  const oppColor = TEAM_COLOR[teamKey === 'A' ? 'B' : 'A'];
  const { opponent, mine } = scout;
  if (!scout.enough) {
    return <div className="sheet p-3"><h3 className="text-lg">분석판</h3><p className="mt-1 text-sm">아직 상대 공격이 적습니다. 공이 몇 번 더 오가면 상대 경향이 보입니다.</p></div>;
  }
  return (
    <div className="space-y-3">
      {scout.tips.length > 0 && (
        <div className="border-2 border-ink bg-ink p-3 text-white">
          <h3 className="text-lg">이렇게 해 보세요</h3>
          <ul className="mt-1 space-y-0.5 text-sm font-medium">{scout.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
        </div>
      )}
      <div className="sheet p-3">
        <h3 className="text-lg">상대 공격 경향 <span className="font-body text-sm font-normal">최근 공격 기준</span></h3>
        <div className="mt-1 space-y-1">
          {opponent.styles.map((s) => <RateBar key={s.style} label={s.name} value={s.share} color={oppColor} />)}
        </div>
        {opponent.topScorers.length > 0 && (
          <p className="mt-2 text-sm"><b>주의할 공격수</b> {opponent.topScorers.map((p) => `${p.number} ${p.name} ${p.count}점`).join(', ')}</p>
        )}
        <p className="mt-1 text-sm"><b>상대 서브</b> {opponent.serves}회 중 에이스 {opponent.aces}, 범실 {opponent.faults}</p>
      </div>
      <div className="sheet p-3">
        <h3 className="text-lg">우리 공격 결과 <span className="font-body text-sm font-normal">최근 {mine.total}회</span></h3>
        <div className="mt-1 space-y-1">
          <RateBar label="득점" value={mine.killRate} color={color} />
          <RateBar label="막힘" value={mine.blockedRate} color="#16161A" />
          <RateBar label="받힘" value={mine.dugRate} color="#16161A" />
          <RateBar label="범실" value={mine.errorRate} color="#C8241B" />
        </div>
      </div>
      <p className="border-l-4 border-ink bg-white p-2 text-sm font-bold">전술 적중 우리 {scout.tacticHits.mine} : {scout.tacticHits.opponent} 상대</p>
    </div>
  );
}

/* 경기 중 */
function LiveMatch({ state, send, serverNow }) {
  const { manager, match, teamNames } = state;
  const { live, teamKey } = manager;
  const [tab, setTab] = useState('scout');
  const brk = match.break;
  const ready = brk?.ready?.[teamKey];
  const boardPlayers = Object.values(live.roster).map((p) => ({ ...p }));
  const canEnd = brk && (brk.kind === 'set' || brk.team === teamKey);

  return (
    <div className="mx-auto max-w-lg space-y-3 px-4 py-4 pb-16">
      <ScoreStrip state={state} />

      {brk ? (
        <>
          <div className="border-2 border-ink bg-white p-3 text-center">
            <p className="font-bold">{brk.kind === 'set' ? '세트 사이 휴식' : `${teamNames[brk.team]} 작전타임`}</p>
            <Countdown deadline={brk.deadline} serverNow={serverNow} className="font-display text-4xl" />
            <p className="text-sm text-muted">시간이 끝나면 지금 설정으로 경기가 다시 시작됩니다.</p>
          </div>
          <Tabs tabs={[['scout', '분석'], ['tactics', '전술'], ['lineup', '자리'], ['sub', '교체']]} value={tab} onChange={setTab} />
          {tab === 'scout' && <ScoutBoard scout={live.scout} teamKey={teamKey} />}
          {tab === 'tactics' && <TacticsPicker tactics={live.tactics} onChange={(tactics) => send('draftTactics', { tactics })} />}
          {tab === 'lineup' && <LineupBoard seats={live.court} players={boardPlayers} allowBench={false} onChange={(seats) => send('arrange', { seats })} />}
          {tab === 'sub' && <SubPanel live={live} send={send} />}
          {canEnd && (
            <button type="button" className={`btn w-full text-lg ${teamKey === 'A' ? 'btn-a' : 'btn-b'}`} disabled={ready} onClick={() => send('breakReady')}>
              {ready ? '상대 감독을 기다리는 중' : '준비 완료, 경기 재개'}
            </button>
          )}
        </>
      ) : (
        <>
          <div className="sheet p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-xl">작전타임</h2>
              <span className="text-sm font-bold">이번 세트 {live.timeoutsLeft}회 남음</span>
            </div>
            <button
              type="button"
              className={`btn w-full text-lg ${teamKey === 'A' ? 'btn-a' : 'btn-b'}`}
              disabled={live.timeoutsLeft <= 0 || Boolean(match.pendingTimeout)}
              onClick={() => send('callTimeout')}
            >
              {match.pendingTimeout === teamKey ? '이 공이 끝나면 작전타임' : match.pendingTimeout ? '상대가 작전타임을 불렀습니다' : '작전타임 부르기'}
            </button>
            <p className="mt-1 text-sm text-muted">전술과 자리는 작전타임과 세트 사이에 바꿀 수 있습니다.</p>
          </div>
          <SubPanel live={live} send={send} />
          <ScoutBoard scout={live.scout} teamKey={teamKey} />
          <div className="sheet p-3 text-sm">
            <h2 className="mb-1 text-xl">지금 전술</h2>
            <ul className="space-y-0.5">
              {Object.entries(TACTIC_OPTIONS).map(([category, def]) => (
                <li key={category}><b>{def.title}</b> {def.options.find((o) => o.id === live.tactics[category])?.name}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default function ManagerScreen({ state, send, serverNow }) {
  if (state.phase === 'match' && state.manager.live) return <LiveMatch state={state} send={send} serverNow={serverNow} />;
  return <PreMatch state={state} send={send} serverNow={serverNow} />;
}
