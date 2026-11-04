import React, { useEffect, useState } from 'react';
import { STAT_LABELS } from '../../shared/paps.js';

export const TEAM_COLOR = { A: '#E9540F', B: '#1A5DBF' };

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="fixed left-1/2 top-4 z-[70] w-[min(92vw,30rem)] -translate-x-1/2 border-2 border-ink bg-alert px-4 py-3 text-center font-bold text-white">
      {message}
    </div>
  );
}

export function OfflineBar({ online }) {
  if (online) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] bg-ink px-4 py-2 text-center text-sm font-bold text-white">
      서버와 연결이 끊겼습니다. 다시 연결하는 중입니다.
    </div>
  );
}

export function formatClock(ms) {
  const total = Math.ceil(Math.abs(ms) / 1000);
  return `${ms < 0 ? '-' : ''}${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function useCountdown(deadline, serverNow) {
  const [left, setLeft] = useState(() => (deadline ? deadline - serverNow() : 0));
  useEffect(() => {
    if (!deadline) return undefined;
    const tick = () => setLeft(deadline - serverNow());
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadline, serverNow]);
  return left;
}

export function Countdown({ deadline, serverNow, className = '' }) {
  const left = useCountdown(deadline, serverNow);
  return (
    <span className={`tabular-nums ${left <= 10000 ? 'text-alert' : ''} ${className}`} role="timer">
      {formatClock(left)}
    </span>
  );
}

export function StatBars({ stats, color = '#16161A' }) {
  return (
    <dl className="space-y-1.5">
      {Object.entries(STAT_LABELS).map(([key, label]) => (
        <div key={key} className="grid grid-cols-[3.6rem_1fr_1.8rem] items-center gap-2 text-sm">
          <dt className="font-medium">{label}</dt>
          <dd className="h-3 border border-ink bg-paper">
            <div className="h-full" style={{ width: `${stats[key]}%`, background: color }} />
          </dd>
          <dd className="text-right font-bold tabular-nums">{stats[key]}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Center({ children }) {
  return <div className="mx-auto w-full max-w-md px-4 py-10">{children}</div>;
}

export function ScoreStrip({ state }) {
  const { match, teamNames } = state;
  if (!match) return null;
  return (
    <div className="sheet grid grid-cols-[1fr_auto_1fr] items-center gap-2 p-3 text-center">
      <div className="min-w-0">
        <div className="truncate font-bold" style={{ color: TEAM_COLOR.A }}>{teamNames.A}{match.serving === 'A' ? ' ●' : ''}</div>
        <div className="font-display text-5xl tabular-nums">{match.score.A}</div>
        <div className="text-xs text-muted">세트 {match.setsWon.A}승</div>
      </div>
      <div className="text-sm font-bold">{match.set}세트<br /><span className="font-normal text-muted">{match.target}점</span></div>
      <div className="min-w-0">
        <div className="truncate font-bold" style={{ color: TEAM_COLOR.B }}>{match.serving === 'B' ? '● ' : ''}{teamNames.B}</div>
        <div className="font-display text-5xl tabular-nums">{match.score.B}</div>
        <div className="text-xs text-muted">세트 {match.setsWon.B}승</div>
      </div>
    </div>
  );
}
