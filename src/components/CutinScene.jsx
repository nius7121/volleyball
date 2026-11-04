import React, { useEffect } from 'react';
import CharacterAvatar from './CharacterAvatar';

export default function CutinScene({ cutin, onFinish }) {
  useEffect(() => {
    if (!cutin) return;
    const timer = setTimeout(() => {
      onFinish();
    }, 1100);
    return () => clearTimeout(timer);
  }, [cutin, onFinish]);

  if (!cutin) return null;

  const { player, actionType, slogan, teamColor } = cutin;

  const getActionBanner = () => {
    switch (actionType) {
      case 'spike':
        return {
          title: 'BOOM SPIKE!! (괴짜 스파이크)',
          sub: '최고 타점에서 내리꽂는 일격!',
          bg: 'bg-haikyu-orange'
        };
      case 'block':
        return {
          title: 'SHUT OUT!! (철벽 블로킹)',
          sub: '도몬(鉄壁) - 그 누구도 넘을 수 없다!',
          bg: 'bg-emerald-600'
        };
      case 'dig':
        return {
          title: 'SUPER DIG!! (신들린 디그)',
          sub: '이어라(繋게)! 공은 아직 살아있다!',
          bg: 'bg-amber-500'
        };
      case 'ace':
        return {
          title: 'SERVICE ACE!! (서비스 에이스)',
          sub: '코트를 가르는 무회전 탄환!',
          bg: 'bg-purple-600'
        };
      default:
        return {
          title: 'CRITICAL PLAY!!',
          sub: '기백의 슈퍼 플레이!',
          bg: 'bg-blue-600'
        };
    }
  };

  const banner = getActionBanner();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm pointer-events-none overflow-hidden select-none">
      {/* 배경 집중선 / 스피드 라인 */}
      <div className="absolute inset-0 bg-speed-lines opacity-40 animate-spin" style={{ animationDuration: '20s' }} />

      {/* 만화 사선 컷 배너 슬라이스 */}
      <div className="relative w-full max-w-4xl mx-4 transform -skew-y-3 bg-[#111216] border-y-8 border-black shadow-2xl p-4 sm:p-6 animate-impact-shake">
        {/* 상단 붓글씨 스타일 뱃지 */}
        <div className="flex items-center justify-between mb-3 border-b-2 border-white/20 pb-2">
          <span className={`text-xs sm:text-sm font-black px-3 py-1 rounded text-black ${banner.bg} uppercase tracking-widest shadow-haikyu`}>
            {banner.title}
          </span>
          <span className="text-white font-black text-sm tracking-widest haikyu-title opacity-80">
            HQ VOLLEYBALL IMPACT
          </span>
        </div>

        {/* 메인 컷인 레이아웃: 캐릭터 클로즈업 + 타이포그래피 */}
        <div className="flex items-center gap-6">
          {/* 캐릭터 대형 아바타 */}
          <div className="flex-shrink-0 relative">
            <div className="absolute -inset-2 bg-white/20 rounded-full blur-md" />
            <CharacterAvatar
              appearance={player?.appearance}
              number={player?.number || 10}
              teamColor={teamColor || '#FF5722'}
              secondaryColor="#111"
              size={110}
            />
          </div>

          {/* 박력 있는 텍스트 */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black text-amber-400">
              {player?.position} • No.{player?.number} {player?.name}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white haikyu-title tracking-wider my-1 drop-shadow-md">
              "{slogan || banner.sub}"
            </h1>
            <p className="text-xs sm:text-sm font-bold text-gray-300">
              {banner.sub}
            </p>
          </div>
        </div>

        {/* 하단 만화 프레임 바 */}
        <div className="mt-3 h-1.5 w-full bg-gradient-to-r from-transparent via-haikyu-orange to-transparent" />
      </div>
    </div>
  );
}

