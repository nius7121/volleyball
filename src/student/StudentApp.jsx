import React, { useState } from 'react';
import { useRoom } from '../net/useRoom';
import CharacterAvatar from '../components/CharacterAvatar';
import CharacterCreator from '../components/CharacterCreator';
import { Center, Countdown, OfflineBar, ScoreStrip, StatBars, Toast, TEAM_COLOR } from '../components/ui';
import ManagerScreen from './ManagerScreen';
import { ROLES, SLOT_BY_ID } from '../../shared/constants.js';

function JoinScreen({ send, ended }) {
  const [form, setForm] = useState({ code: '', number: '', name: '', pin: '' });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const ready = /^\d{4}$/.test(form.code) && form.number && form.name.trim() && /^\d{4}$/.test(form.pin);
  return (
    <Center>
      <h1 className="cut-title text-3xl">우리반 배구 리그</h1>
      {ended && <p className="mt-3 border-2 border-ink bg-white p-3 font-medium">이 기기의 접속이 끝났습니다. 다시 들어오려면 아래에 입력해 주세요.</p>}
      <form
        className="sheet mt-4 space-y-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) send('join', { ...form, number: Number(form.number) });
        }}
      >
        <label className="block text-sm font-bold">방 코드
          <input inputMode="numeric" autoComplete="off" maxLength={4} value={form.code} onChange={set('code')} className="mt-1 text-center font-display text-2xl tracking-[0.3em]" placeholder="0000" />
        </label>
        <div className="grid grid-cols-[5rem_1fr] gap-3">
          <label className="block text-sm font-bold">번호
            <input type="number" inputMode="numeric" min="1" max="60" autoComplete="off" value={form.number} onChange={set('number')} className="mt-1" />
          </label>
          <label className="block text-sm font-bold">이름
            <input maxLength={10} autoComplete="off" value={form.name} onChange={set('name')} className="mt-1" />
          </label>
        </div>
        <label className="block text-sm font-bold">PIN 4자리
          <input type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={form.pin} onChange={set('pin')} className="mt-1" />
          <span className="mt-1 block font-normal text-muted">처음이면 새로 정합니다. 접속이 끊겼을 때 이 번호로 다시 들어와요.</span>
        </label>
        <button type="submit" className="btn btn-main w-full text-lg" disabled={!ready}>입장하기</button>
      </form>
    </Center>
  );
}

const LINE_LABELS = [
  ['points', '득점'], ['kills', '공격 성공'], ['aces', '서브 에이스'], ['blocks', '블로킹'],
  ['digs', '디그'], ['superDigs', '슈퍼 디그'], ['receives', '리시브'], ['assists', '토스 도움'],
];

function MyLine({ line }) {
  return (
    <div className="sheet p-4">
      <h2 className="mb-2 text-xl">내 기록</h2>
      <dl className="grid grid-cols-4 gap-2 text-center">
        {LINE_LABELS.map(([key, label]) => (
          <div key={key} className="border border-line p-1.5">
            <dd className="font-display text-2xl tabular-nums">{line?.[key] ?? 0}</dd>
            <dt className="text-xs text-muted">{label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ResultForStudent({ state }) {
  const { result, teamNames, me } = state;
  const mvp = result.players.find((p) => p.id === result.mvpId);
  const myResult = result.players.find((p) => p.id === me.id);
  return (
    <div className="space-y-3">
      <div className="sheet tone p-5 text-center">
        <p className="font-bold">경기 종료</p>
        <h1 className="text-4xl" style={{ color: TEAM_COLOR[result.winner] }}>{teamNames[result.winner]} 승리!</h1>
        <p className="mt-1 font-medium tabular-nums">{result.setScores.map((s) => `${s.A}:${s.B}`).join('  ')}</p>
      </div>
      {mvp && <div className="sheet p-3 text-center"><span className="font-bold">MVP</span> <span className="font-display text-2xl">{mvp.name}</span></div>}
      {myResult && <MyLine line={myResult.line} />}
    </div>
  );
}

function StudentHome({ state, onEdit, serverNow }) {
  const { me, phase, teamNames, managerName, teammates, myStatus, mySlot, myLine, match } = state;
  const color = me.teamKey ? TEAM_COLOR[me.teamKey] : '#16161A';
  const teamName = me.teamKey ? teamNames[me.teamKey] : null;

  const statusLine = () => {
    if (phase === 'setup') return teamName ? `${teamName} 소속입니다. 팀 구성이 끝날 때까지 기다려 주세요.` : '선생님이 팀을 나누고 있어요.';
    if (phase === 'tactics') return teamName ? `${managerName ?? '감독'} 감독이 라인업과 전술을 짜는 중입니다.` : '이번 경기는 관전합니다.';
    if (phase === 'match') {
      if (myStatus === 'court') return `코트 위! ${SLOT_BY_ID[mySlot]?.label ?? ''} 자리에서 뛰고 있어요.`;
      if (myStatus === 'bench') return '벤치에서 대기 중입니다. 감독이 부르면 출전해요.';
      return '앞의 큰 화면을 봐 주세요.';
    }
    return '';
  };

  return (
    <div className="mx-auto max-w-md space-y-3 px-4 py-5 pb-16">
      {phase === 'finished' && state.result ? <ResultForStudent state={state} /> : (
        <>
          {match && <ScoreStrip state={state} />}
          {match?.break && (
            <div className="border-2 border-ink bg-white p-3 text-center font-bold">
              {match.break.kind === 'set' ? '세트 사이 휴식' : `${teamNames[match.break.team]} 작전타임`}{' '}
              <Countdown deadline={match.break.deadline} serverNow={serverNow} className="font-display text-xl" />
            </div>
          )}
          <div className="border-l-8 bg-white p-3 font-bold" style={{ borderColor: color }}>
            {statusLine()}
            {phase === 'tactics' && state.tacticsDeadline && (
              <div className="mt-1 font-normal">남은 시간 <Countdown deadline={state.tacticsDeadline} serverNow={serverNow} className="font-bold" /></div>
            )}
          </div>
          {match && myStatus !== 'none' && <MyLine line={myLine} />}
        </>
      )}

      {me.character && (
        <div className="sheet p-4">
          <div className="flex items-center gap-3">
            <CharacterAvatar appearance={me.character.appearance} number={me.character.number} teamColor={color} secondaryColor="#16161A" size={84} />
            <div className="min-w-0">
              <div className="truncate font-display text-2xl">{me.character.name}</div>
              <div className="text-sm text-muted">{ROLES[me.character.hopePosition].name} 희망</div>
              {phase === 'setup' && <button type="button" onClick={onEdit} className="btn btn-small mt-1">선수 수정</button>}
            </div>
          </div>
          <div className="mt-3"><StatBars stats={me.stats} color={color} /></div>
        </div>
      )}

      {teammates.length > 0 && phase !== 'match' && phase !== 'finished' && (
        <div className="sheet p-4">
          <h2 className="mb-2 text-xl">우리 팀</h2>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            {teammates.map((p) => <li key={p.id} className="truncate"><b className="tabular-nums">{p.number}</b> {p.name}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function StudentApp() {
  const room = useRoom();
  const { state, online, toast, send, serverNow, replaced } = room;
  const [editing, setEditing] = useState(false);

  let body;
  if (replaced) {
    body = <Center><div className="sheet p-5 font-medium">다른 기기에서 같은 이름으로 입장해서 이 화면의 접속이 끝났습니다. 새로고침하면 다시 입장할 수 있습니다.</div></Center>;
  } else if (!state) {
    body = <JoinScreen send={send} />;
  } else if (state.me.isManager && (state.phase === 'tactics' || state.phase === 'match')) {
    body = <ManagerScreen state={state} send={send} serverNow={serverNow} />;
  } else if ((!state.me.character && state.phase === 'setup') || (editing && state.phase === 'setup')) {
    body = (
      <CharacterCreator
        initial={state.me.character}
        saveLabel={state.me.character ? '수정 완료' : '선수 등록'}
        onCancel={state.me.character ? () => setEditing(false) : null}
        onSave={(character) => {
          send('saveCharacter', { character });
          setEditing(false);
        }}
      />
    );
  } else if (!state.me.character) {
    body = <Center><div className="sheet p-5 font-medium">이미 경기가 시작되어 이번 경기는 관전합니다. 앞의 큰 화면을 봐 주세요.</div></Center>;
  } else {
    body = <StudentHome state={state} onEdit={() => setEditing(true)} serverNow={serverNow} />;
  }

  return (
    <>
      <Toast message={toast} />
      <OfflineBar online={online} />
      {body}
    </>
  );
}
