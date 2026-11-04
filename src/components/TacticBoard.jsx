import React from 'react';
import { TACTIC_OPTIONS } from '../data/volleyballTactics';
import { Play, Sliders, Shield, Zap, Target, Wind, Crosshair } from './Icons';

export default function TacticBoard({
  teams,
  onUpdateTactics,
  onStartMatch,
  onBackToRoster
}) {
  const teamA = teams.teamA;
  const teamB = teams.teamB;

  const handleTacticChange = (teamKey, category, value) => {
    onUpdateTactics(teamKey, {
      ...teams[teamKey].tactics,
      [category]: value
    });
  };

  const renderTacticSection = (teamKey, currentTactics, isTeamA) => {
    const accentColor = isTeamA ? 'text-haikyu-orange' : 'text-red-500';
    const borderColor = isTeamA ? 'border-haikyu-orange' : 'border-red-500';
    const activeBg = isTeamA ? 'bg-haikyu-orange text-black' : 'bg-red-600 text-white';

    return (
      <div className="space-y-4">
        {/* 1. 서브 전술 */}
        <div className="bg-[#101217] p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-2 font-black text-sm">
            <Crosshair className={`w-4 h-4 ${accentColor}`} />
            <span className="text-white">서브 집중 타겟</span>
          </div>
          <div className="space-y-2">
            {TACTIC_OPTIONS.serveTarget.map(opt => (
              <label
                key={opt.id}
                onClick={() => handleTacticChange(teamKey, 'serveTarget', opt.id)}
                className={`block p-2.5 rounded-lg border cursor-pointer transition text-xs ${currentTactics.serveTarget === opt.id
                    ? `${borderColor} bg-gray-900/90 shadow-sm`
                    : 'border-gray-800 hover:border-gray-700 bg-black/40'
                  }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-white">{opt.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${currentTactics.serveTarget === opt.id ? activeBg : 'bg-gray-800 text-gray-400'
                    }`}>
                    {currentTactics.serveTarget === opt.id ? '선택됨' : '선택'}
                  </span>
                </div>
                <p className="text-gray-400 text-[11px] mb-1">{opt.desc}</p>
                <span className="text-[10px] font-bold text-amber-400">⚡ 효과: {opt.bonus}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 2. 서브 강도 및 스타일 */}
        <div className="bg-[#101217] p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-2 font-black text-sm">
            <Zap className={`w-4 h-4 ${accentColor}`} />
            <span className="text-white">서브 공격 강도</span>
          </div>
          <div className="space-y-2">
            {TACTIC_OPTIONS.serveRisk.map(opt => (
              <label
                key={opt.id}
                onClick={() => handleTacticChange(teamKey, 'serveRisk', opt.id)}
                className={`block p-2.5 rounded-lg border cursor-pointer transition text-xs ${currentTactics.serveRisk === opt.id
                    ? `${borderColor} bg-gray-900/90 shadow-sm`
                    : 'border-gray-800 hover:border-gray-700 bg-black/40'
                  }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-white">{opt.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${currentTactics.serveRisk === opt.id ? activeBg : 'bg-gray-800 text-gray-400'
                    }`}>
                    {currentTactics.serveRisk === opt.id ? '선택됨' : '선택'}
                  </span>
                </div>
                <p className="text-gray-400 text-[11px] mb-1">{opt.desc}</p>
                <span className="text-[10px] font-bold text-cyan-400">⚡ 효과: {opt.bonus}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 3. 공격 전술 */}
        <div className="bg-[#101217] p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-2 font-black text-sm">
            <Target className={`w-4 h-4 ${accentColor}`} />
            <span className="text-white">주력 공격 전술 & 콤비네이션</span>
          </div>
          <div className="space-y-2">
            {TACTIC_OPTIONS.attackStyle.map(opt => (
              <label
                key={opt.id}
                onClick={() => handleTacticChange(teamKey, 'attackStyle', opt.id)}
                className={`block p-2.5 rounded-lg border cursor-pointer transition text-xs ${currentTactics.attackStyle === opt.id
                    ? `${borderColor} bg-gray-900/90 shadow-sm`
                    : 'border-gray-800 hover:border-gray-700 bg-black/40'
                  }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-white">{opt.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${currentTactics.attackStyle === opt.id ? activeBg : 'bg-gray-800 text-gray-400'
                    }`}>
                    {currentTactics.attackStyle === opt.id ? '선택됨' : '선택'}
                  </span>
                </div>
                <p className="text-gray-400 text-[11px] mb-1">{opt.desc}</p>
                <span className="text-[10px] font-bold text-haikyu-orange">⚡ 효과: {opt.bonus}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 4. 블로킹 시스템 */}
        <div className="bg-[#101217] p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-2 font-black text-sm">
            <Shield className={`w-4 h-4 ${accentColor}`} />
            <span className="text-white">블로킹 시스템 (네트 앞 방어)</span>
          </div>
          <div className="space-y-2">
            {TACTIC_OPTIONS.blockSystem.map(opt => (
              <label
                key={opt.id}
                onClick={() => handleTacticChange(teamKey, 'blockSystem', opt.id)}
                className={`block p-2.5 rounded-lg border cursor-pointer transition text-xs ${currentTactics.blockSystem === opt.id
                    ? `${borderColor} bg-gray-900/90 shadow-sm`
                    : 'border-gray-800 hover:border-gray-700 bg-black/40'
                  }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-white">{opt.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${currentTactics.blockSystem === opt.id ? activeBg : 'bg-gray-800 text-gray-400'
                    }`}>
                    {currentTactics.blockSystem === opt.id ? '선택됨' : '선택'}
                  </span>
                </div>
                <p className="text-gray-400 text-[11px] mb-1">{opt.desc}</p>
                <span className="text-[10px] font-bold text-emerald-400">⚡ 효과: {opt.bonus}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 상단 안내 바 */}
      <div className="flex flex-wrap items-center justify-between bg-[#15171e] border-2 border-[#2b303f] rounded-2xl p-5 shadow-haikyu">
        <div>
          <span className="text-xs uppercase font-black bg-haikyu-orange text-black px-2 py-0.5 rounded tracking-wider mr-2">
            TACTICAL COMMAND CENTER
          </span>
          <h2 className="text-2xl font-black haikyu-title text-white tracking-wide mt-1">
            감독 작전판 : 팀별 배구 전술 설정
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            양 팀의 서브, 공격 콤비네이션, 블로킹 시스템을 설정하세요. 경기 중 감독 작전 타임이나 세트 종료 후에도 언제든 수정할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-3 mt-3 sm:mt-0">
          <button
            onClick={onBackToRoster}
            className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-lg text-xs border border-gray-700 transition"
          >
            ← 로스터/라인업 수정
          </button>
          <button
            onClick={onStartMatch}
            className="flex items-center gap-2 px-6 py-3 bg-haikyu-orange hover:bg-haikyu-orangeDark text-white font-black rounded-xl text-base shadow-haikyu-lg transition hover:scale-105 active:scale-95 animate-pulse"
          >
            <Play className="w-5 h-5 fill-white" /> 가상 경기 개시!
          </button>
        </div>
      </div>

      {/* 두 팀의 전술 보드 나란히 배치 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TEAM A TACTICS */}
        <div className="bg-[#121318] border-2 border-[#FF5722] rounded-2xl p-5 shadow-haikyu">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-haikyu-orange text-black px-2 py-0.5 rounded">
                TEAM A STRATEGY
              </span>
              <h3 className="text-xl font-black text-white haikyu-title mt-1">{teamA.name}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-haikyu-orange">"{teamA.motto}"</span>
            </div>
          </div>
          {renderTacticSection('teamA', teamA.tactics, true)}
        </div>

        {/* TEAM B TACTICS */}
        <div className="bg-[#121318] border-2 border-[#DC2626] rounded-2xl p-5 shadow-haikyu">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded">
                TEAM B STRATEGY
              </span>
              <h3 className="text-xl font-black text-white haikyu-title mt-1">{teamB.name}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-red-500">"{teamB.motto}"</span>
            </div>
          </div>
          {renderTacticSection('teamB', teamB.tactics, false)}
        </div>
      </div>
    </div>
  );
}
