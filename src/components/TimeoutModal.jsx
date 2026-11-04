import React, { useState } from 'react';
import { TACTIC_OPTIONS } from '../data/volleyballTactics';
import { Clock, Shield, Target, Zap, CheckCircle2, MessageSquare } from './Icons';

const COACH_SPEECHES = [
  '“침착해라! 서두르지 말고 공을 끝까지 눈으로 쫓아라!”',
  '“우리의 무기는 끈기다. 네트 너머로 반드시 이어라!”',
  '“상대 에이스가 지치기 시작했다! 서브를 그쪽으로 집중시켜!”',
  '“블로킹은 서두르지 말고 리드 블록으로 타이밍을 맞춰 뛰어라!”',
  '“한 점 빼앗겼다고 기죽지 마라. 다음 공이 진짜 승부다!”'
];

export default function TimeoutModal({
  callingTeam,
  teams,
  onApplyTactics,
  onClose
}) {
  const team = teams[callingTeam];
  const isTeamA = callingTeam === 'teamA';
  const accentColor = isTeamA ? 'text-haikyu-orange' : 'text-red-500';
  const btnColor = isTeamA ? 'bg-haikyu-orange hover:bg-orange-600' : 'bg-red-600 hover:bg-red-700';

  const [tactics, setTactics] = useState({ ...team.tactics });
  const [randomQuote] = useState(
    COACH_SPEECHES[Math.floor(Math.random() * COACH_SPEECHES.length)]
  );

  const handleSaveAndResume = () => {
    onApplyTactics(callingTeam, tactics);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#12141a] border-4 border-haikyu-orange rounded-2xl max-w-2xl w-full p-6 shadow-haikyu-lg my-8">
        {/* 상단 타이머 & 감독 작전타임 배너 */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-gray-700 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-haikyu-orange text-black rounded-lg">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                BENCH TIMEOUT • 작전 타임
              </span>
              <h2 className="text-xl font-black text-white haikyu-title">
                {team.name} 감독 작전 지시
              </h2>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400 font-bold">남은 작전타임</span>
            <div className="text-xl font-black font-mono text-amber-400">
              {team.timeoutsRemaining} / 2 회
            </div>
          </div>
        </div>

        {/* 감독 격려사 / 전술 훈화 */}
        <div className="bg-[#181b24] p-3.5 rounded-xl border border-gray-800 mb-4 flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-haikyu-orange flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-black text-haikyu-orange mb-0.5">감독의 벤치 코멘트</div>
            <p className="text-sm font-bold text-gray-200 italic">{randomQuote}</p>
            <p className="text-[11px] text-emerald-400 font-bold mt-1">
              ✨ 작전 타임으로 선수들의 체력 및 멘탈이 회복되었습니다!
            </p>
          </div>
        </div>

        {/* 즉각 전술 수정 세션 */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
            긴급 전술 변경
          </h3>

          {/* 서브 타겟 */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              서브 목적타 대상 변경
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {TACTIC_OPTIONS.serveTarget.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTactics(prev => ({ ...prev, serveTarget: opt.id }))}
                  className={`p-2 rounded-lg border font-bold text-left transition ${
                    tactics.serveTarget === opt.id
                      ? 'bg-haikyu-orange text-black border-haikyu-orange font-black'
                      : 'bg-black/40 text-gray-400 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="font-black text-xs">{opt.name.split(' ')[0]}</div>
                  <div className="text-[10px] opacity-80 truncate">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 공격 스타일 */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              공격 콤비네이션 변경
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {TACTIC_OPTIONS.attackStyle.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTactics(prev => ({ ...prev, attackStyle: opt.id }))}
                  className={`p-2 rounded-lg border font-bold text-left transition ${
                    tactics.attackStyle === opt.id
                      ? 'bg-haikyu-orange text-black border-haikyu-orange font-black'
                      : 'bg-black/40 text-gray-400 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="font-black text-xs truncate">{opt.name.split(' ')[0]}</div>
                  <div className="text-[10px] opacity-80 truncate">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 블로킹 시스템 */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              네트 앞 블로킹 전술 변경
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {TACTIC_OPTIONS.blockSystem.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTactics(prev => ({ ...prev, blockSystem: opt.id }))}
                  className={`p-2 rounded-lg border font-bold text-left transition ${
                    tactics.blockSystem === opt.id
                      ? 'bg-haikyu-orange text-black border-haikyu-orange font-black'
                      : 'bg-black/40 text-gray-400 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="font-black text-xs">{opt.name.split(' ')[0]}</div>
                  <div className="text-[10px] opacity-80 truncate">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-lg text-xs"
          >
            변경 없이 닫기
          </button>
          <button
            onClick={handleSaveAndResume}
            className={`flex items-center gap-2 px-6 py-2.5 ${btnColor} text-white font-black rounded-lg text-sm shadow-haikyu transition hover:scale-105`}
          >
            <CheckCircle2 className="w-4 h-4" /> 작전 지시 완료 & 경기 재개
          </button>
        </div>
      </div>
    </div>
  );
}
