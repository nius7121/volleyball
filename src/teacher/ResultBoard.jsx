import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import CharacterAvatar from '../components/CharacterAvatar';
import { TEAM_COLOR } from '../components/ui';
import { TACTIC_OPTIONS, tacticName } from '../../shared/tactics.js';

const LEADERS = [
  ['points', '득점'], ['blocks', '블로킹'], ['aces', '서브 에이스'], ['digs', '디그'], ['assists', '토스 도움'],
];

const KIND_NAME = { ace: '서비스 에이스', superDig: '슈퍼 디그', block: '철벽 블로킹' };

export default function ResultBoard({ state, send }) {
  const { result, teamNames } = state;
  const color = TEAM_COLOR[result.winner];
  const mvp = result.players.find((p) => p.id === result.mvpId);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    confetti({ particleCount: 160, spread: 90, origin: { y: 0.3 }, colors: [color, '#16161A', '#FFE14D'] });
  }, [color]);

  const leaderOf = (field) => result.players.reduce((best, p) => ((p.line?.[field] ?? 0) > (best?.line?.[field] ?? 0) ? p : best), null);
  const highlightCounts = result.highlights.reduce((acc, h) => ({ ...acc, [h.kind]: (acc[h.kind] ?? 0) + 1 }), {});

  return (
    <div className="mx-auto max-w-6xl space-y-3 p-4">
      <section className="sheet tone p-6 text-center">
        <p className="text-xl font-bold">경기 종료</p>
        <h1 className="text-[clamp(3rem,7vw,7rem)] leading-tight" style={{ color }}>{teamNames[result.winner]} 승리!</h1>
        <table className="mx-auto mt-2 bg-white text-center text-lg">
          <thead>
            <tr>
              <th className="border-2 border-ink px-3 py-1">팀</th>
              {result.setScores.map((s) => <th key={s.set} className="border-2 border-ink px-3 py-1">{s.set}세트</th>)}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {['A', 'B'].map((key) => (
              <tr key={key}>
                <th className="border-2 border-ink px-3 py-1" style={{ color: TEAM_COLOR[key] }}>{teamNames[key]}</th>
                {result.setScores.map((s) => <td key={s.set} className={`border-2 border-ink px-3 py-1 ${s.winner === key ? 'font-bold' : ''}`}>{s[key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid gap-3 md:grid-cols-[auto_1fr]">
        {mvp && (
          <section className="sheet flex items-center gap-3 p-4">
            <CharacterAvatar appearance={mvp.appearance} number={mvp.number} teamColor={TEAM_COLOR[mvp.teamKey]} secondaryColor="#16161A" size={120} />
            <div>
              <p className="font-bold">MVP</p>
              <p className="font-display text-4xl">{mvp.name}</p>
              {mvp.catchphrase && <p className="mt-1 text-sm">{mvp.catchphrase}</p>}
            </div>
          </section>
        )}
        <section className="sheet p-4">
          <h2 className="text-2xl">부문별 1위</h2>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 lg:grid-cols-5">
            {LEADERS.map(([field, label]) => {
              const leader = leaderOf(field);
              return (
                <div key={field}>
                  <dt className="text-sm text-muted">{label}</dt>
                  <dd className="font-bold">{leader ? `${leader.name} ${leader.line[field]}` : '없음'}</dd>
                </div>
              );
            })}
          </dl>
          <p className="mt-3 text-sm font-medium">
            이번 경기 명장면: {Object.entries(KIND_NAME).map(([k, name]) => `${name} ${highlightCounts[k] ?? 0}번`).join(' · ')}
          </p>
        </section>
      </div>

      <section className="sheet p-4">
        <h2 className="text-2xl">두 감독의 마지막 전술</h2>
        <p className="mt-1 font-bold">전술 적중 <span style={{ color: TEAM_COLOR.A }}>{teamNames.A} {result.tacticHits.A}</span> : <span style={{ color: TEAM_COLOR.B }}>{result.tacticHits.B} {teamNames.B}</span></p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="py-1 pr-3" scope="col">항목</th>
                <th className="py-1 pr-3" scope="col" style={{ color: TEAM_COLOR.A }}>{teamNames.A}</th>
                <th className="py-1" scope="col" style={{ color: TEAM_COLOR.B }}>{teamNames.B}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(TACTIC_OPTIONS).map(([category, def]) => (
                <tr key={category} className="border-b border-line">
                  <th className="py-1 pr-3 font-medium" scope="row">{def.title}</th>
                  <td className="py-1 pr-3">{tacticName(category, result.tactics.A[category])}</td>
                  <td className="py-1">{tacticName(category, result.tactics.B[category])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap justify-between gap-2">
        <button type="button" className="btn btn-main text-lg" onClick={() => send('backToSetup')}>팀을 바꿔 새 경기</button>
        <button
          type="button"
          className="btn text-alert"
          onClick={() => {
            if (window.confirm('수업을 끝낼까요? 학생 정보와 경기 기록이 모두 지워지고 되돌릴 수 없습니다.')) send('endClass');
          }}
        >
          수업 종료 (모든 정보 삭제)
        </button>
      </div>
    </div>
  );
}
