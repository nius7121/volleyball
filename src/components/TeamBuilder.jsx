import React, { useState } from 'react';
import CharacterCard from './CharacterCard';
import { Users, Shuffle, ShieldCheck, ArrowRightLeft, Plus } from './Icons';

export default function TeamBuilder({
  characters,
  teams,
  gameMode = '6person',
  onChangeGameMode,
  onUpdateTeams,
  onGoToTactics,
  onOpenCreator
}) {
  const [selectedCharId, setSelectedCharId] = useState(null);

  const is9Man = gameMode === '9person';
  const maxStarters = is9Man ? 9 : 6;

  // 캐릭터 id -> 객체 맵핑
  const charMap = new Map(characters.map(c => [c.id, c]));

  const teamA = teams.teamA;
  const teamB = teams.teamB;

  // 9인제 포지션 라벨
  const posLabels9 = [
    '전위 레프트(LF)', '전위 센터(CF)', '전위 라이트(RF)',
    '중위 레프트(ML)', '중위 센터/세터(MC)', '중위 라이트(MR)',
    '후위 레프트(BL)', '후위 센터(BC)', '후위 라이트/서버(BR)'
  ];

  // 팀 소속 확인
  const getCharLocation = (charId) => {
    if (teamA.starterIds.includes(charId)) return { team: 'teamA', role: 'starter' };
    if (teamA.benchIds.includes(charId)) return { team: 'teamA', role: 'bench' };

    if (teamB.starterIds.includes(charId)) return { team: 'teamB', role: 'starter' };
    if (teamB.benchIds.includes(charId)) return { team: 'teamB', role: 'bench' };

    return { team: 'free', role: 'none' };
  };

  // 선수를 특정 팀/역할로 이동
  const assignCharacter = (charId, targetTeam, targetRole) => {
    const updatedA = {
      ...teamA,
      starterIds: [...teamA.starterIds.filter(id => id !== charId)],
      benchIds: [...teamA.benchIds.filter(id => id !== charId)]
    };
    const updatedB = {
      ...teamB,
      starterIds: [...teamB.starterIds.filter(id => id !== charId)],
      benchIds: [...teamB.benchIds.filter(id => id !== charId)]
    };

    const target = targetTeam === 'teamA' ? updatedA : updatedB;

    if (targetRole === 'starter') {
      if (target.starterIds.length >= maxStarters) {
        alert(`${is9Man ? '9인제' : '6인제'} 선발 라인업은 최대 ${maxStarters}명입니다.`);
        return;
      }
      target.starterIds.push(charId);
      const char = charMap.get(charId);
      if (!is9Man && char?.position === 'L') {
        target.liberoId = charId;
      }
    } else if (targetRole === 'bench') {
      target.benchIds.push(charId);
    }

    onUpdateTeams({
      teamA: updatedA,
      teamB: updatedB
    });
  };

  // 팀 자동 밸런스 분배 기능 (OVR 지수 기반 핑퐁 배분)
  const handleAutoBalance = () => {
    const sorted = [...characters].sort((a, b) => b.stats.ovr - a.stats.ovr);
    const newAStarters = [];
    const newABench = [];

    const newBStarters = [];
    const newBBench = [];

    sorted.forEach((char, idx) => {
      if (idx % 2 === 0) {
        if (newAStarters.length < maxStarters) {
          newAStarters.push(char.id);
        } else {
          newABench.push(char.id);
        }
      } else {
        if (newBStarters.length < maxStarters) {
          newBStarters.push(char.id);
        } else {
          newBBench.push(char.id);
        }
      }
    });

    onUpdateTeams({
      teamA: { ...teamA, starterIds: newAStarters, benchIds: newABench },
      teamB: { ...teamB, starterIds: newBStarters, benchIds: newBBench }
    });
  };

  // 각 팀 평균 OVR 계산
  const calcTeamAverage = (charIds) => {
    if (!charIds || charIds.length === 0) return 0;
    const total = charIds.slice(0, maxStarters).reduce((sum, id) => {
      const c = charMap.get(id);
      return sum + (c ? c.stats.ovr : 0);
    }, 0);
    return Math.round(total / Math.min(charIds.length, maxStarters));
  };

  const teamAOvr = calcTeamAverage(teamA.starterIds);
  const teamBOvr = calcTeamAverage(teamB.starterIds);

  return (
    <div className="space-y-6">
      {/* 상단 컨트롤 바 */}
      <div className="flex flex-wrap items-center justify-between bg-[#15171e] border-2 border-[#2b303f] rounded-2xl p-4 shadow-haikyu">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-black bg-amber-500 text-black px-2 py-0.5 rounded tracking-wider">
              ROSTER & LINEUP
            </span>
            {/* 6인제 / 9인제 모드 토글 */}
            <div className="flex bg-[#0d0e12] rounded-lg p-0.5 border border-gray-700">
              <button
                onClick={() => onChangeGameMode('6person')}
                className={`px-3 py-1 rounded-md text-xs font-black transition ${
                  !is9Man ? 'bg-haikyu-orange text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                6인제 배구
              </button>
              <button
                onClick={() => onChangeGameMode('9person')}
                className={`px-3 py-1 rounded-md text-xs font-black transition ${
                  is9Man ? 'bg-haikyu-yellow text-black shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                9인제 배구 (3열 포메이션)
              </button>
            </div>
          </div>
          <h2 className="text-2xl font-black haikyu-title text-white tracking-wide mt-1">
            {is9Man ? '9인제 배구 팀 라인업 편성 (전위·중위·후위 9명)' : '6인제 배구 팀 라인업 편성 (주전 6명 + 리베로)'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {is9Man
              ? '9인제 배구는 전위 3명, 중위 3명, 후위 3명으로 3열 수비망을 구성하며 학교 스포츠클럽 배구 룰로 진행됩니다.'
              : 'FIVB 표준 6인제 배구 룰로 전위 3명, 후위 3명 및 리베로가 구성됩니다.'}
          </p>
        </div>

        <div className="flex items-center gap-3 mt-3 sm:mt-0">
          <button
            onClick={onOpenCreator}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> 새 캐릭터 추가
          </button>

          <button
            onClick={handleAutoBalance}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-amber-300 font-bold rounded-lg text-xs border border-gray-700 shadow-sm transition"
          >
            <Shuffle className="w-4 h-4" /> {is9Man ? '9인제 자동 밸런싱' : '6인제 자동 밸런싱'}
          </button>

          <button
            onClick={onGoToTactics}
            className="flex items-center gap-2 px-5 py-2.5 bg-haikyu-orange hover:bg-haikyu-orangeDark text-white font-black rounded-lg text-sm shadow-haikyu transition hover:scale-105"
          >
            전술 설정하기 <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 두 팀 비교 대진판 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TEAM A */}
        <div className="bg-[#121318] border-2 border-[#FF5722] rounded-2xl p-5 shadow-haikyu relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-haikyu-orange/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex justify-between items-center pb-3 border-b border-gray-800 mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-haikyu-orange text-black px-2 py-0.5 rounded">
                TEAM A • 까마귀단
              </span>
              <h3 className="text-xl font-black text-white haikyu-title mt-1">{teamA.name}</h3>
              <p className="text-xs text-haikyu-orange font-bold">"{teamA.motto}"</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 font-bold">선발 팀 OVR</span>
              <div className="text-3xl font-black font-mono text-haikyu-orange">{teamAOvr}</div>
            </div>
          </div>

          {/* 선발 라인업 (6명 or 9명) */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-haikyu-orange" />
                선발 라인업 ({Math.min(maxStarters, teamA.starterIds.length)}/{maxStarters})
              </span>
              <span className="text-[11px] text-gray-400">
                {is9Man ? '전위 3명 / 중위 3명 / 후위 3명' : '배구 코트 주전 6인'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {teamA.starterIds.slice(0, maxStarters).map((id, idx) => {
                const char = charMap.get(id);
                if (!char) return null;
                return (
                  <div key={id} className="relative group">
                    {is9Man && (
                      <span className="absolute top-1 left-2 z-20 text-[9px] font-black bg-black/80 text-amber-300 px-1 rounded border border-gray-700">
                        {posLabels9[idx]}
                      </span>
                    )}
                    <CharacterCard character={char} selected={selectedCharId === id} />
                    <button
                      onClick={() => assignCharacter(id, 'teamA', 'bench')}
                      className="absolute top-2 right-2 hidden group-hover:block bg-gray-900/90 hover:bg-haikyu-orange text-white text-[10px] px-1.5 py-0.5 rounded font-bold border border-gray-700 z-30"
                    >
                      벤치로
                    </button>
                  </div>
                );
              })}
              {Array.from({ length: Math.max(0, maxStarters - teamA.starterIds.length) }).map((_, i) => (
                <div
                  key={i}
                  className="border-2 border-dashed border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center text-center text-gray-600 min-h-[140px]"
                >
                  <Users className="w-6 h-6 mb-1 opacity-50" />
                  <span className="text-xs font-bold">
                    {is9Man ? `${posLabels9[teamA.starterIds.length + i]} 빈자리` : '선발 빈자리'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 벤치 후보 선수 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
                벤치 대기 요원 ({teamA.benchIds.length}명)
              </span>
              <span className="text-[11px] text-gray-500">원포인트 교체 요원</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {teamA.benchIds.map(id => {
                const char = charMap.get(id);
                if (!char) return null;
                return (
                  <div key={id} className="relative group opacity-85 hover:opacity-100">
                    <CharacterCard character={char} />
                    <button
                      onClick={() => assignCharacter(id, 'teamA', 'starter')}
                      className="absolute top-2 right-2 hidden group-hover:block bg-haikyu-orange hover:bg-orange-600 text-white text-[10px] px-1.5 py-0.5 rounded font-black shadow"
                    >
                      선발로
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* TEAM B */}
        <div className="bg-[#121318] border-2 border-[#DC2626] rounded-2xl p-5 shadow-haikyu relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex justify-between items-center pb-3 border-b border-gray-800 mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded">
                TEAM B • 고양이단
              </span>
              <h3 className="text-xl font-black text-white haikyu-title mt-1">{teamB.name}</h3>
              <p className="text-xs text-red-400 font-bold">"{teamB.motto}"</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 font-bold">선발 팀 OVR</span>
              <div className="text-3xl font-black font-mono text-red-500">{teamBOvr}</div>
            </div>
          </div>

          {/* 선발 라인업 (6명 or 9명) */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-red-500" />
                선발 라인업 ({Math.min(maxStarters, teamB.starterIds.length)}/{maxStarters})
              </span>
              <span className="text-[11px] text-gray-400">
                {is9Man ? '전위 3명 / 중위 3명 / 후위 3명' : '배구 코트 주전 6인'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {teamB.starterIds.slice(0, maxStarters).map((id, idx) => {
                const char = charMap.get(id);
                if (!char) return null;
                return (
                  <div key={id} className="relative group">
                    {is9Man && (
                      <span className="absolute top-1 left-2 z-20 text-[9px] font-black bg-black/80 text-amber-300 px-1 rounded border border-gray-700">
                        {posLabels9[idx]}
                      </span>
                    )}
                    <CharacterCard character={char} selected={selectedCharId === id} />
                    <button
                      onClick={() => assignCharacter(id, 'teamB', 'bench')}
                      className="absolute top-2 right-2 hidden group-hover:block bg-gray-900/90 hover:bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold border border-gray-700 z-30"
                    >
                      벤치로
                    </button>
                  </div>
                );
              })}
              {Array.from({ length: Math.max(0, maxStarters - teamB.starterIds.length) }).map((_, i) => (
                <div
                  key={i}
                  className="border-2 border-dashed border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center text-center text-gray-600 min-h-[140px]"
                >
                  <Users className="w-6 h-6 mb-1 opacity-50" />
                  <span className="text-xs font-bold">
                    {is9Man ? `${posLabels9[teamB.starterIds.length + i]} 빈자리` : '선발 빈자리'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 벤치 후보 선수 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
                벤치 대기 요원 ({teamB.benchIds.length}명)
              </span>
              <span className="text-[11px] text-gray-500">원포인트 교체 요원</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {teamB.benchIds.map(id => {
                const char = charMap.get(id);
                if (!char) return null;
                return (
                  <div key={id} className="relative group opacity-85 hover:opacity-100">
                    <CharacterCard character={char} />
                    <button
                      onClick={() => assignCharacter(id, 'teamB', 'starter')}
                      className="absolute top-2 right-2 hidden group-hover:block bg-red-600 hover:bg-red-700 text-white text-[10px] px-1.5 py-0.5 rounded font-black shadow"
                    >
                      선발로
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 전체 선수 풀 */}
      <div className="bg-[#15171e] border border-[#2b303f] rounded-2xl p-5 shadow-haikyu">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-black text-white haikyu-title">
              전체 등록 선수 풀 ({characters.length}명)
            </h3>
            <p className="text-xs text-gray-400">
              원하는 팀의 선발 또는 벤치로 클릭 한 번에 배치할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {characters.map(char => {
            const loc = getCharLocation(char.id);
            return (
              <div key={char.id} className="relative group">
                <CharacterCard character={char} />
                <div className="absolute inset-0 bg-black/85 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center p-2 rounded-xl gap-1">
                  <div className="text-[10px] font-black text-white mb-0.5">
                    현재: {loc.team === 'teamA' ? '팀 A' : loc.team === 'teamB' ? '팀 B' : '무소속'}
                  </div>
                  <button
                    onClick={() => assignCharacter(char.id, 'teamA', 'starter')}
                    className="w-full py-1 text-[10px] bg-haikyu-orange hover:bg-orange-600 text-white font-black rounded"
                  >
                    팀 A 선발
                  </button>
                  <button
                    onClick={() => assignCharacter(char.id, 'teamA', 'bench')}
                    className="w-full py-1 text-[10px] bg-orange-950 hover:bg-orange-900 text-orange-200 font-bold rounded"
                  >
                    팀 A 벤치
                  </button>
                  <button
                    onClick={() => assignCharacter(char.id, 'teamB', 'starter')}
                    className="w-full py-1 text-[10px] bg-red-600 hover:bg-red-700 text-white font-black rounded"
                  >
                    팀 B 선발
                  </button>
                  <button
                    onClick={() => assignCharacter(char.id, 'teamB', 'bench')}
                    className="w-full py-1 text-[10px] bg-red-950 hover:bg-red-900 text-red-200 font-bold rounded"
                  >
                    팀 B 벤치
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
