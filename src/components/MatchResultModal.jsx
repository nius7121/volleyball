import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import CharacterAvatar from './CharacterAvatar';
import { Trophy, Award, Sliders, ArrowRight, RotateCcw } from './Icons';

export default function MatchResultModal({
  matchState,
  teams,
  charMap,
  onNextSet,
  onModifyTactics,
  onRestartMatch
}) {
  const { isGameOver, isSetOver, setScores, currentSet, winner } = matchState;

  useEffect(() => {
    if (isGameOver) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [isGameOver]);

  const winningTeam = winner ? teams[winner] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#12141a] border-4 border-haikyu-orange rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-haikyu-lg my-8 text-center relative overflow-hidden">
        {/* 하이큐 승리 팡파레 배경 */}
        <div className="absolute inset-0 bg-speed-lines opacity-20 pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-haikyu-orange text-black font-black rounded-full text-xs uppercase tracking-widest mb-3 shadow">
            <Trophy className="w-3.5 h-3.5" />
            {isGameOver ? 'MATCH COMPLETE • 경기 최종 종료' : `SET ${currentSet} FINISHED • 세트 종료`}
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white haikyu-title tracking-wider mb-2">
            {isGameOver
              ? `${winningTeam?.name} 승리!!`
              : `${setScores[currentSet - 1]?.teamAScore > setScores[currentSet - 1]?.teamBScore ? teams.teamA.name : teams.teamB.name} 세트 획득!`}
          </h2>

          <p className="text-sm font-bold text-amber-400 mb-6 italic">
            "{winningTeam?.motto || '코트에 남는 것은 오직 승자뿐이다'}"
          </p>

          {/* 세트별 스코어 보드 판 */}
          <div className="bg-[#181a24] border-2 border-gray-800 rounded-2xl p-4 max-w-lg mx-auto mb-6">
            <div className="grid grid-cols-3 text-xs font-black text-gray-400 border-b border-gray-700 pb-2 mb-2">
              <span className="text-haikyu-orange">{teams.teamA.name}</span>
              <span>SET</span>
              <span className="text-red-500">{teams.teamB.name}</span>
            </div>

            {setScores.map((s, idx) => (
              <div
                key={idx}
                className="grid grid-cols-3 py-1.5 items-center font-mono font-black text-lg border-b border-gray-800/60 last:border-0"
              >
                <span className={s.teamAScore > s.teamBScore ? 'text-haikyu-orange' : 'text-gray-400'}>
                  {s.teamAScore}
                </span>
                <span className="text-xs text-gray-500 font-sans font-bold">Set {s.setNum}</span>
                <span className={s.teamBScore > s.teamAScore ? 'text-red-500' : 'text-gray-400'}>
                  {s.teamBScore}
                </span>
              </div>
            ))}
          </div>

          {/* 세트 인터벌 시 전술 수정 또는 다음 세트 진행 버튼 */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {!isGameOver ? (
              <>
                <button
                  onClick={onModifyTactics}
                  className="flex items-center gap-2 px-5 py-3 bg-gray-800 hover:bg-gray-700 text-amber-300 font-black rounded-xl text-sm border border-gray-700 shadow-sm transition hover:scale-105"
                >
                  <Sliders className="w-4 h-4" /> 다음 세트 전술 및 선수 교체
                </button>
                <button
                  onClick={onNextSet}
                  className="flex items-center gap-2 px-6 py-3 bg-haikyu-orange hover:bg-haikyu-orangeDark text-white font-black rounded-xl text-base shadow-haikyu transition hover:scale-105"
                >
                  다음 세트 개시 <ArrowRight className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={onRestartMatch}
                className="flex items-center gap-2 px-8 py-3.5 bg-haikyu-orange hover:bg-haikyu-orangeDark text-white font-black rounded-xl text-lg shadow-haikyu-lg transition hover:scale-105"
              >
                <RotateCcw className="w-5 h-5" /> 새로운 매치 시작
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
