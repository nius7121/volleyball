import React from 'react';
import CharacterAvatar from './CharacterAvatar';
import { getTier } from '../data/papsData';
import { Shield, Zap, Target, Wind, Activity, ArrowUp } from './Icons';

export default function CharacterCard({
  character,
  onSelect,
  selected = false,
  showActions = false,
  onEdit,
  onDelete
}) {
  const { name, position, number, height, catchphrase, stats, paps, appearance } = character;
  const tier = getTier(stats.ovr);

  const getPositionBadge = (pos) => {
    switch (pos) {
      case 'S':
        return { name: '세터 (S)', color: 'bg-indigo-600 text-white' };
      case 'MB':
        return { name: '미들 블로커 (MB)', color: 'bg-emerald-600 text-white' };
      case 'L':
        return { name: '리베로 (L)', color: 'bg-amber-500 text-black font-black' };
      case 'WS':
      case 'OH':
        return { name: '윙 스파이커 (WS)', color: 'bg-orange-600 text-white' };
      case 'OP':
        return { name: '아포짓 (OP)', color: 'bg-rose-600 text-white' };
      default:
        return { name: pos, color: 'bg-gray-600 text-white' };
    }
  };

  const posBadge = getPositionBadge(position);

  return (
    <div
      onClick={onSelect}
      className={`relative group bg-[#16181f] border-2 rounded-xl p-4 transition-all duration-200 cursor-pointer overflow-hidden ${
        selected
          ? 'border-haikyu-orange shadow-haikyu-orange scale-[1.02]'
          : 'border-[#2e323e] hover:border-gray-400 hover:shadow-haikyu'
      }`}
    >
      {/* 카드 배경 만화 도트 패턴 */}
      <div className="absolute inset-0 bg-comic-dots opacity-40 pointer-events-none" />

      {/* 상단: 포지션 뱃지 & 등번호 & 종합 등급 */}
      <div className="relative z-10 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded text-xs font-black tracking-wider ${posBadge.color} shadow-sm`}>
            {posBadge.name}
          </span>
          <span className="text-xs text-gray-400 font-bold">No.{number}</span>
        </div>
        <div className={`px-2 py-0.5 rounded text-xs font-black border ${tier.color}`}>
          OVR {stats.ovr} ({tier.label.split(' ')[0]})
        </div>
      </div>

      {/* 중간: 아바타 & 기본 프로필 */}
      <div className="relative z-10 flex items-center gap-3 mb-3">
        <div className="flex-shrink-0">
          <CharacterAvatar
            appearance={appearance}
            number={number}
            size={76}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black text-white truncate haikyu-title tracking-wide">
            {name}
          </h3>
          <p className="text-xs text-amber-400 font-bold mb-1">
            신장: {height}cm
          </p>
          <p className="text-[11px] text-gray-300 italic truncate border-l-2 border-haikyu-orange pl-1.5 py-0.5">
            "{catchphrase || '최선을 다한다!'}"
          </p>
        </div>
      </div>

      {/* PAPS 5대 종목 등급 태그 */}
      <div className="relative z-10 grid grid-cols-5 gap-1 text-[10px] text-center mb-3 bg-[#0d0e12] p-1.5 rounded-lg border border-[#232732]">
        <div title="심폐지구력 (셔틀런)">
          <div className="text-gray-400 font-medium">셔틀런</div>
          <div className="font-black text-amber-300">{paps.shuttleRunGrade}등급</div>
        </div>
        <div title="순발력 (제자리멀리뛰기)">
          <div className="text-gray-400 font-medium">제멀</div>
          <div className="font-black text-cyan-300">{paps.standingJumpGrade}등급</div>
        </div>
        <div title="근력 (악력)">
          <div className="text-gray-400 font-medium">악력</div>
          <div className="font-black text-rose-300">{paps.gripStrengthGrade}등급</div>
        </div>
        <div title="유연성 (좌전굴)">
          <div className="text-gray-400 font-medium">유연성</div>
          <div className="font-black text-emerald-300">{paps.sitAndReachGrade}등급</div>
        </div>
        <div title="근지구력 (윗몸일으키기)">
          <div className="text-gray-400 font-medium">윗몸</div>
          <div className="font-black text-purple-300">{paps.sitUpsGrade}등급</div>
        </div>
      </div>

      {/* 배구 6대 스탯 미니 바 */}
      <div className="relative z-10 space-y-1 text-[11px]">
        <div className="flex justify-between items-center text-xs">
          <span className="flex items-center gap-1 text-gray-300">
            <Zap className="w-3 h-3 text-haikyu-orange" /> 스파이크
          </span>
          <span className="font-mono font-black text-haikyu-orange">{stats.spike}</span>
        </div>
        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-haikyu-orange h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, (stats.spike / 99) * 100)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs pt-1">
          <span className="flex items-center gap-1 text-gray-300">
            <Shield className="w-3 h-3 text-emerald-400" /> 블로킹
          </span>
          <span className="font-mono font-black text-emerald-400">{stats.block}</span>
        </div>
        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-400 h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, (stats.block / 99) * 100)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs pt-1">
          <span className="flex items-center gap-1 text-gray-300">
            <Activity className="w-3 h-3 text-cyan-400" /> 리시브 / 디그
          </span>
          <span className="font-mono font-black text-cyan-400">{stats.receive}</span>
        </div>
        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-cyan-400 h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, (stats.receive / 99) * 100)}%` }}
          />
        </div>
      </div>

      {/* 관리 액션 버튼들 */}
      {showActions && (
        <div className="relative z-10 flex gap-2 mt-3 pt-2 border-t border-gray-800">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(character);
              }}
              className="flex-1 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-200 font-bold transition"
            >
              수정
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(character.id);
              }}
              className="px-2 py-1 text-xs bg-red-950/70 hover:bg-red-800 text-red-300 rounded font-bold transition"
            >
              삭제
            </button>
          )}
        </div>
      )}
    </div>
  );
}
