import React, { useEffect, useMemo, useState } from 'react';
import { useRoom } from '../net/useRoom';
import { Center, Countdown, OfflineBar, Toast, TEAM_COLOR, useCountdown } from '../components/ui';
import { PAPS_ITEMS } from '../../shared/paps.js';
import { RULES } from '../../shared/constants.js';
import MatchStage from './MatchStage';
import ResultBoard from './ResultBoard';

const KEY_STORAGE = 'volley_teacher_key';

function readTeacherKey() {
  const fromUrl = new URLSearchParams(window.location.search).get('key');
  if (fromUrl) {
    try { sessionStorage.setItem(KEY_STORAGE, fromUrl); } catch { /* 저장이 막히면 메모리의 값만 쓴다 */ }
    // 프로젝터에 주소창이 비칠 수 있으므로 열쇠를 주소에서 지운다.
    window.history.replaceState(null, '', '/teacher');
    return fromUrl;
  }
  try { return sessionStorage.getItem(KEY_STORAGE); } catch { return null; }
}

/* 접속 안내 */
function AccessPanel({ state }) {
  const connected = state.students.filter((s) => s.connected).length;
  return (
    <section className="sheet grid gap-4 p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
      <div className="h-40 w-40 shrink-0" aria-label="학생 접속 QR 코드" dangerouslySetInnerHTML={{ __html: state.access.qrSvg }} />
      <div className="min-w-0">
        <p className="font-bold">학생 접속 주소</p>
        <p className="break-all font-display text-3xl lg:text-4xl">{state.access.mainUrl.replace('http://', '')}</p>
        {state.access.urls.slice(1).map((url) => <p key={url} className="text-sm text-muted">접속이 안 되면: {url.replace('http://', '')}</p>)}
        <p className="mt-1 text-sm font-medium">접속 {connected}명 · 캐릭터 완성 {state.students.filter((s) => s.character).length}명 / 입장 {state.students.length}명</p>
      </div>
      <div className="text-center">
        <p className="font-bold">방 코드</p>
        <p className="font-display text-7xl tabular-nums">{state.code}</p>
      </div>
    </section>
  );
}

/* 학생 정보 수정: 프로젝터에 비치지 않게 눌렀을 때만 연다 */
function StudentEditor({ student, send, onClose }) {
  const [draft, setDraft] = useState(student.character);
  if (!draft) {
    return (
      <Modal title={`${student.number} ${student.realName}`} onClose={onClose}>
        <p>아직 캐릭터를 만들지 않았습니다.</p>
        <EditorActions student={student} send={send} onClose={onClose} />
      </Modal>
    );
  }
  return (
    <Modal title={`${student.number} ${student.realName} 정보`} onClose={onClose}>
      <p className="mb-3 border-l-4 border-alert pl-2 text-sm font-bold">건강 정보가 보입니다. 프로젝터를 끄거나 화면을 가린 뒤 수정해 주세요.</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 block text-sm font-bold">코트 이름
          <input maxLength={10} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="mt-1" />
        </label>
        <label className="col-span-2 block text-sm font-bold">각오 한마디
          <input maxLength={30} value={draft.catchphrase} onChange={(e) => setDraft({ ...draft, catchphrase: e.target.value })} className="mt-1" />
        </label>
        <label className="block text-sm font-bold">키
          <input type="number" value={draft.height} onChange={(e) => setDraft({ ...draft, height: e.target.value })} className="mt-1" />
        </label>
        {PAPS_ITEMS.map((item) => (
          <label key={item.key} className="block text-sm font-bold">{item.name}
            <select value={draft.paps[item.gradeKey]} onChange={(e) => setDraft({ ...draft, paps: { ...draft.paps, [item.gradeKey]: Number(e.target.value) } })} className="mt-1">
              {[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>{g}등급</option>)}
            </select>
          </label>
        ))}
      </div>
      <button type="button" className="btn btn-main mt-3 w-full" onClick={() => { send('editStudent', { studentId: student.id, character: draft }); onClose(); }}>저장</button>
      <EditorActions student={student} send={send} onClose={onClose} />
    </Modal>
  );
}

function EditorActions({ student, send, onClose }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t-2 border-line pt-3">
      <button type="button" className="btn btn-small" onClick={() => { send('resetPin', { studentId: student.id }); onClose(); }}>PIN 초기화</button>
      <button
        type="button"
        className="btn btn-small text-alert"
        onClick={() => {
          if (window.confirm(`${student.realName} 학생을 방에서 내보낼까요?`)) {
            send('removeStudent', { studentId: student.id });
            onClose();
          }
        }}
      >
        내보내기
      </button>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-paper/95 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet mt-4 w-full max-w-lg p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-2xl">{title}</h2>
          <button type="button" className="btn btn-small" onClick={onClose}>닫기</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StudentRow({ student, teamKey, send, onEdit, canManage }) {
  return (
    <li className="flex flex-wrap items-center gap-1.5 border-b border-line py-1.5 last:border-b-0">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${student.connected ? 'bg-ok' : 'bg-line'}`} title={student.connected ? '접속 중' : '접속 끊김'} />
      <button type="button" onClick={() => onEdit(student)} className="min-w-0 flex-1 truncate text-left font-medium underline-offset-2 hover:underline">
        <b className="tabular-nums">{student.number}</b> {student.realName}
        {student.character ? <span className="text-sm text-muted"> ({student.character.name} · {student.stats.ovr})</span> : <span className="text-sm text-alert"> 제작 중</span>}
        {student.pinReset && <span className="text-sm text-alert"> PIN 초기화됨</span>}
      </button>
      <span className="flex gap-1">
        {teamKey !== 'A' && <button type="button" className="btn btn-small btn-a" disabled={!student.character} onClick={() => send('assign', { studentId: student.id, team: 'A' })}>주황</button>}
        {teamKey !== 'B' && <button type="button" className="btn btn-small btn-b" disabled={!student.character} onClick={() => send('assign', { studentId: student.id, team: 'B' })}>파랑</button>}
        {teamKey && <button type="button" className="btn btn-small" onClick={() => send('assign', { studentId: student.id, team: null })}>빼기</button>}
        {canManage && <button type="button" className="btn btn-small" onClick={() => send('setManager', { team: teamKey, studentId: student.id })}>감독</button>}
      </span>
    </li>
  );
}

function TeamColumn({ teamKey, state, send, onEdit }) {
  const team = state.teams[teamKey];
  const byId = useMemo(() => Object.fromEntries(state.students.map((s) => [s.id, s])), [state.students]);
  const players = team.playerIds.map((id) => byId[id]).filter(Boolean).sort((a, b) => a.number - b.number);
  const manager = team.managerId ? byId[team.managerId] : null;
  const allPlayers = players.filter((p) => p.stats);
  const avg = allPlayers.length ? Math.round(allPlayers.reduce((sum, p) => sum + p.stats.ovr, 0) / allPlayers.length) : 0;
  const color = TEAM_COLOR[teamKey];
  return (
    <section className="sheet flex min-w-0 flex-col border-t-8 p-3" style={{ borderTopColor: color }}>
      <input aria-label="팀 이름" defaultValue={team.name} key={team.name} maxLength={12} onBlur={(e) => { if (e.target.value.trim() && e.target.value !== team.name) send('setTeamName', { team: teamKey, name: e.target.value }); }} className="border-0 border-b-2 p-0 font-display text-2xl" style={{ color }} />
      <p className="mt-1 text-sm font-medium">선수 {team.playerIds.length}명 · 평균 능력치 {avg}</p>
      <div className="mt-2 border-2 border-ink p-2">
        <span className="font-bold">감독 </span>
        {manager ? <span>{manager.number} {manager.realName} <span className="text-sm text-muted">{manager.connected ? '' : '(접속 끊김)'}</span></span> : <span className="font-bold text-alert">아래 선수의 감독 버튼을 눌러 주세요</span>}
        {manager && <button type="button" className="btn btn-small ml-2" onClick={() => send('assign', { studentId: manager.id, team: teamKey })}>선수로 되돌리기</button>}
      </div>
      <ul className="mt-2">
        {players.map((s) => <StudentRow key={s.id} student={s} teamKey={teamKey} send={send} onEdit={onEdit} canManage />)}
      </ul>
      {team.npcs.length > 0 && (
        <div className="mt-2 flex items-center justify-between gap-2 text-sm">
          <span className="font-medium">NPC {team.npcs.length}명: {team.npcs.map((n) => n.name).join(', ')}</span>
          <button type="button" className="btn btn-small" onClick={() => send('removeNpcs', { team: teamKey })}>NPC 빼기</button>
        </div>
      )}
    </section>
  );
}

function SetupScreen({ state, send }) {
  const [editing, setEditing] = useState(null);
  const unassigned = state.students.filter((s) => !s.teamKey);
  const editingStudent = editing && state.students.find((s) => s.id === editing.id);
  const shortCount = ['A', 'B'].some((k) => state.teams[k].playerIds.length < RULES.starters);
  return (
    <div className="mx-auto max-w-7xl space-y-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="cut-title text-3xl">우리반 배구 리그</h1>
        <p className="text-sm text-muted">학생 정보는 이 수업에서만 쓰고 저장하지 않습니다. 이름을 누르면 수정할 수 있습니다.</p>
      </header>
      <AccessPanel state={state} />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-main" onClick={() => send('autoSplit')}>능력치로 자동 분배</button>
        <button type="button" className="btn" disabled={!shortCount} onClick={() => send('fillNpc')}>빈자리 NPC로 채우기</button>
        <span className="ml-auto flex items-center gap-1">
          <span className="font-bold">경기 분량</span>
          {Object.values(state.formats).map((f) => (
            <button key={f.id} type="button" aria-pressed={state.format === f.id} className={`btn ${state.format === f.id ? 'btn-main' : ''}`} onClick={() => send('setFormat', { format: f.id })}>{f.name} ({f.target}점)</button>
          ))}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <section className="sheet min-w-0 p-3">
          <h2 className="text-2xl">미배정 {unassigned.length}명</h2>
          {unassigned.length === 0 && <p className="mt-2 text-sm text-muted">{state.students.length === 0 ? '학생 입장을 기다리는 중입니다.' : '모두 배정했습니다.'}</p>}
          <ul className="mt-2">
            {unassigned.map((s) => <StudentRow key={s.id} student={s} teamKey={null} send={send} onEdit={setEditing} canManage={false} />)}
          </ul>
        </section>
        <TeamColumn teamKey="A" state={state} send={send} onEdit={setEditing} />
        <TeamColumn teamKey="B" state={state} send={send} onEdit={setEditing} />
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t-2 border-ink bg-paper py-3">
        <ul className="min-w-0 flex-1 text-sm font-bold text-alert">
          {state.setupProblems.map((p) => <li key={p}>{p}</li>)}
        </ul>
        <button type="button" className="btn btn-main text-lg" disabled={state.setupProblems.length > 0} onClick={() => send('startTactics')}>감독 전술 시간 시작 (10분)</button>
      </div>

      {editingStudent && <StudentEditor student={editingStudent} send={send} onClose={() => setEditing(null)} />}
    </div>
  );
}

function TacticsScreen({ state, send, serverNow }) {
  const left = useCountdown(state.tacticsDeadline, serverNow);
  const allReady = state.teams.A.confirmed && state.teams.B.confirmed;
  const byId = Object.fromEntries(state.students.map((s) => [s.id, s]));
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <div className="sheet tone p-6 text-center">
        <h1 className="text-3xl">감독 전술 시간</h1>
        <div className="font-display text-8xl leading-tight"><Countdown deadline={state.tacticsDeadline} serverNow={serverNow} /></div>
        {left <= 0 && !allReady && <p className="text-lg font-bold text-alert">시간이 끝났습니다. 감독을 바꾸거나 지금 설정으로 확정해 주세요.</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {['A', 'B'].map((key) => {
          const team = state.teams[key];
          return (
            <section key={key} className="sheet border-t-8 p-4" style={{ borderTopColor: TEAM_COLOR[key] }}>
              <h2 className="text-3xl" style={{ color: TEAM_COLOR[key] }}>{team.name}</h2>
              <p className="mt-1 text-lg font-medium">감독 {team.managerName} {team.managerConnected ? '' : <b className="text-alert">접속 끊김</b>}</p>
              <p className={`mt-2 border-2 border-ink p-2 text-center text-xl font-bold ${team.confirmed ? 'bg-ink text-white' : 'bg-white'}`}>{team.confirmed ? '확정 완료' : '작성 중'}</p>
              <details className="mt-3">
                <summary className="cursor-pointer font-bold">감독이 못 끝낼 때</summary>
                <div className="mt-2 space-y-2">
                  <label className="block text-sm font-bold">감독 바꾸기
                    <select value="" onChange={(e) => e.target.value && send('setManager', { team: key, studentId: e.target.value })} className="mt-1">
                      <option value="">선수 선택</option>
                      {team.playerIds.filter((id) => byId[id]).map((id) => <option key={id} value={id}>{byId[id].number} {byId[id].realName}</option>)}
                    </select>
                  </label>
                  <button type="button" className="btn w-full" disabled={team.confirmed} onClick={() => send('forceConfirm', { team: key })}>지금 설정으로 강제 확정</button>
                </div>
              </details>
            </section>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="btn" onClick={() => { if (window.confirm('팀 구성으로 돌아갈까요? 감독이 작성한 전술은 지워집니다.')) send('backToSetup'); }}>팀 구성으로 돌아가기</button>
        <button type="button" className="btn btn-main px-8 text-2xl" disabled={!allReady} onClick={() => send('startMatch')}>{allReady ? '경기 시작' : '두 감독의 확정을 기다리는 중'}</button>
      </div>
    </div>
  );
}

export default function TeacherApp() {
  const [teacherKey] = useState(readTeacherKey);
  const room = useRoom({ teacherKey: teacherKey ?? 'none' });
  const { state, rally, online, toast, send, serverNow, denied } = room;

  if (!teacherKey || denied) {
    return <Center><div className="sheet p-5 font-medium">선생님 화면은 서버를 켠 검은 창에 표시된 주소로 열어 주세요. 서버를 다시 켰다면 주소가 바뀝니다.</div></Center>;
  }
  if (!state) return <Center><p className="font-bold">서버에 연결하는 중입니다.</p><OfflineBar online={online} /></Center>;

  return (
    <>
      <Toast message={toast} />
      <OfflineBar online={online} />
      {state.phase === 'setup' && <SetupScreen state={state} send={send} />}
      {state.phase === 'tactics' && <TacticsScreen state={state} send={send} serverNow={serverNow} />}
      {state.phase === 'match' && <MatchStage state={state} rally={rally} send={send} serverNow={serverNow} />}
      {state.phase === 'finished' && <ResultBoard state={state} send={send} />}
    </>
  );
}
