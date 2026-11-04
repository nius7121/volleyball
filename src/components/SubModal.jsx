import React, { useState } from 'react';
import CharacterAvatar from './CharacterAvatar';
import { ArrowRightLeft, Zap, Shield, Sparkles, AlertCircle } from './Icons';

export default function SubModal({
  callingTeam,
  teams,
  charMap,
  gameMode = '6person',
  onPerformSub,
  onClose
}) {
  const team = teams[callingTeam];
  const isTeamA = callingTeam === 'teamA';
  const is9Man = gameMode === '9person';
  const maxStarters = is9Man ? 9 : 6;

  const activeStarters = team.starterIds.slice(0, maxStarters);

  const [selectedOutId, setSelectedOutId] = useState(activeStarters[0] || null);
  const [selectedInId, setSelectedInId] = useState(team.benchIds[0] || null);

  const remainingSubs = team.substitutionsRemaining ?? (is9Man ? 9 : 6);

  // 원포인트 서버 추천 (벤치 중 서브 스탯 최고 선수)
  const getPinchServer = () => {
    if (team.benchIds.length === 0) return null;
    let best = null;
    let maxServe = -1;
    team.benchIds.forEach(id => {
      const c = charMap.get(id);
      if (c && c.stats.serve > maxServe) {
        maxServe = c.stats.serve;
        best = c;
      }
    });
    return best;
  };

  // 원포인트 블로커 추천 (벤치 중 신장/블로킹 최고 선수)
  const getBlockerSub = () => {
    if (team.benchIds.length === 0) return null;
    let best = null;
    let maxBlock = -1;
    team.benchIds.forEach(id => {
      const c = charMap.get(id);
      if (c && c.stats.block > maxBlock) {
        maxBlock = c.stats.block;
        best = c;
      }
    });
    return best;
  };

  const pinchServer = getPinchServer();
  const blockerSub = getBlockerSub();

  const handleExecuteSub = () => {
    if (remainingSubs <= 0) {
      alert(`이번 세트 선수 교체 허용 횟수(${is9Man ? 9 : 6}회)를 모두 소진했습니다!`);
      return;
    }
    if (!selectedOutId || !selectedInId) {
      alert('코트 밖으로 나갈 선수와 교체 투입될 벤치 선수를 모두 선택해주세요.');
      return;
    }

    onPerformSub(callingTeam, selectedOutId, selectedInId);
    onClose();
  };

  const handleQuickPinchServer = () => {
    if (!pinchServer) return;
    setSelectedInId(pinchServer.id);
  };

  const handleQuickBlocker = () => {
    if (!blockerSub) return;
    setSelectedInId(blockerSub.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#12141a] border-4 border-haikyu-yellow rounded-2xl max-w-2xl w-full p-6 shadow-haikyu-lg my-8">
        {/* 상단 배너 */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-gray-700 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-haikyu-yellow text-black rounded-lg">
              <ArrowRightLeft className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-haikyu-yellow">
                {is9Man ? '9인제 배구 교체' : 'FIVB 6인제 공식 교체'} • SUBSTITUTION
              </span>
              <h2 className="text-xl font-black text-white haikyu-title">
                {team.name} 선수 교체 전략 ({is9Man ? '9인제 모드' : '6인제 모드'})
              </h2>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400 font-bold">남은 교체</span>
            <div className={`text-xl font-black font-mono ${remainingSubs > 0 ? 'text-haikyu-yellow' : 'text-red-500'}`}>
              {remainingSubs} / {is9Man ? 9 : 6} 회
            </div>
          </div>
        </div>

        {/* 배구 특화 교체 전략 원클릭 바로가기 */}
        <div className="mb-4">
          <div className="text-xs font-black text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-haikyu-yellow" /> 하이큐식 특화 교체 전술 추천
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {pinchServer && (
              <button
                type="button"
                onClick={handleQuickPinchServer}
                className="p-2.5 bg-[#181c25] hover:bg-[#202533] border border-haikyu-orange rounded-xl text-left transition flex items-center gap-3"
              >
                <div className="p-2 bg-haikyu-orange text-black rounded-lg">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-white">원포인트 서버 투입!</div>
                  <div className="text-[11px] text-haikyu-orange font-bold">
                    {pinchServer.name} (서브: {pinchServer.stats.serve})
                  </div>
                  <div className="text-[10px] text-gray-400">후위 서브 타임에 투입하여 연속 에이스 노림</div>
                </div>
              </button>
            )}

            {blockerSub && (
              <button
                type="button"
                onClick={handleQuickBlocker}
                className="p-2.5 bg-[#181c25] hover:bg-[#202533] border border-emerald-500 rounded-xl text-left transition flex items-center gap-3"
              >
                <div className="p-2 bg-emerald-600 text-white rounded-lg">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-white">원포인트 블로커 투입!</div>
                  <div className="text-[11px] text-emerald-400 font-bold">
                    {blockerSub.name} ({blockerSub.height}cm / 블로킹: {blockerSub.stats.block})
                  </div>
                  <div className="text-[10px] text-gray-400">전위 높이와 셧아웃 철벽 방어 강화</div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* 교체 선수 선택 영역 (OUT vs IN) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {/* 1. OUT: 코트 밖으로 나갈 주전 선수 */}
          <div className="bg-[#101217] p-3.5 rounded-xl border border-rose-900/50">
            <span className="text-xs font-black text-rose-400 uppercase tracking-wider block mb-2">
              ▼ 코트 OUT (벤치로 물러날 선수)
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {activeStarters.map(id => {
                const char = charMap.get(id);
                if (!char) return null;
                const isSelected = selectedOutId === id;
                return (
                  <div
                    key={id}
                    onClick={() => setSelectedOutId(id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border text-xs ${
                      isSelected
                        ? 'bg-rose-950/80 border-rose-500 text-white font-black'
                        : 'bg-black/30 border-gray-800 text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CharacterAvatar appearance={char.appearance} number={char.number} size={30} />
                      <div>
                        <div className="font-bold">{char.name}</div>
                        <div className="text-[10px] text-gray-400">{char.position} • {char.height}cm</div>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-gray-300">OVR {char.stats.ovr}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. IN: 교체 투입될 벤치 선수 */}
          <div className="bg-[#101217] p-3.5 rounded-xl border border-emerald-900/50">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block mb-2">
              ▲ 코트 IN (새로 투입될 벤치 선수)
            </span>
            {team.benchIds.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500">
                벤치에 대기 중인 후보 선수가 없습니다.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {team.benchIds.map(id => {
                  const char = charMap.get(id);
                  if (!char) return null;
                  const isSelected = selectedInId === id;
                  return (
                    <div
                      key={id}
                      onClick={() => setSelectedInId(id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border text-xs ${
                        isSelected
                          ? 'bg-emerald-950/80 border-emerald-500 text-white font-black'
                          : 'bg-black/30 border-gray-800 text-gray-300 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CharacterAvatar appearance={char.appearance} number={char.number} size={30} />
                        <div>
                          <div className="font-bold">{char.name}</div>
                          <div className="text-[10px] text-gray-400">{char.position} • {char.height}cm</div>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-400">OVR {char.stats.ovr}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 배구 교체 룰 안내 */}
        <div className="flex items-center gap-2 text-[11px] text-gray-400 bg-black/40 p-2.5 rounded-lg border border-gray-800 mb-5">
          <AlertCircle className="w-4 h-4 text-haikyu-yellow flex-shrink-0" />
          <span>
            {is9Man
              ? '9인제 배구 규칙: 세트당 팀당 최대 9회까지 자유롭게 선수를 교체하여 전위/중위/후위 전력을 보강할 수 있습니다.'
              : 'FIVB Re-entry 룰: 세트 중 벤치로 나간 선수는 해당 세트에 자신과 교체된 원래 선수와만 다시 교체될 수 있습니다. (리베로는 자유 교체)'}
          </span>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-lg text-xs"
          >
            취소
          </button>
          <button
            onClick={handleExecuteSub}
            disabled={remainingSubs <= 0 || !selectedInId}
            className="flex items-center gap-2 px-6 py-2.5 bg-haikyu-yellow hover:bg-yellow-400 text-black font-black rounded-lg text-sm shadow-haikyu transition hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
          >
            <ArrowRightLeft className="w-4 h-4" /> 교체 확정 & 코트 투입
          </button>
        </div>
      </div>
    </div>
  );
}
