import React from 'react';
import CharacterAvatar from './CharacterAvatar';

/**
 * 하이큐 애니메이션 만화풍 배구 코트 2.5D 시각화
 * 6인제 (6-person) 및 9인제 (9-person) 모드 완전 지원
 */
export default function Court2D({
  teamA,
  teamB,
  charMap,
  gameMode = '6person', // '6person' | '9person'
  ballPos = { x: 50, y: 50, z: 0, state: 'idle' },
  activeAction = null,
  servingTeam = 'teamA',
  rotationA = [0, 1, 2, 3, 4, 5],
  rotationB = [0, 1, 2, 3, 4, 5]
}) {
  const is9Man = gameMode === '9person';

  // 6인제 배구 코트 좌표 (6개 위치)
  const courtAPositions6 = [
    { x: 18, y: 78, posName: '1번 (후위 우측/서브)' },
    { x: 38, y: 78, posName: '2번 (전위 우측/라이트)' },
    { x: 38, y: 50, posName: '3번 (전위 중앙/센터)' },
    { x: 38, y: 22, posName: '4번 (전위 좌측/레프트)' },
    { x: 18, y: 22, posName: '5번 (후위 좌측)' },
    { x: 16, y: 50, posName: '6번 (후위 중앙)' }
  ];

  const courtBPositions6 = [
    { x: 82, y: 22, posName: '1번 (후위 우측/서브)' },
    { x: 62, y: 22, posName: '2번 (전위 우측/라이트)' },
    { x: 62, y: 50, posName: '3번 (전위 중앙/센터)' },
    { x: 62, y: 78, posName: '4번 (전위 좌측/레프트)' },
    { x: 82, y: 78, posName: '5번 (후위 좌측)' },
    { x: 84, y: 50, posName: '6번 (후위 중앙)' }
  ];

  // 9인제 배구 코트 좌표 (전위 3명, 중위 3명, 후위 3명 총 9개 위치)
  const courtAPositions9 = [
    // 전위 (Front Row)
    { x: 38, y: 22, posName: '전위 레프트(LF)' },
    { x: 38, y: 50, posName: '전위 센터(CF)' },
    { x: 38, y: 78, posName: '전위 라이트(RF)' },
    // 중위 (Middle/Half Row)
    { x: 26, y: 22, posName: '중위 레프트(ML)' },
    { x: 26, y: 50, posName: '중위 센터(MC/세터)' },
    { x: 26, y: 78, posName: '중위 라이트(MR)' },
    // 후위 (Back Row)
    { x: 14, y: 22, posName: '후위 레프트(BL)' },
    { x: 14, y: 50, posName: '후위 센터(BC)' },
    { x: 14, y: 78, posName: '후위 라이트(BR/서버)' }
  ];

  const courtBPositions9 = [
    // 전위 (Front Row)
    { x: 62, y: 22, posName: '전위 레프트(LF)' },
    { x: 62, y: 50, posName: '전위 센터(CF)' },
    { x: 62, y: 78, posName: '전위 라이트(RF)' },
    // 중위 (Middle/Half Row)
    { x: 74, y: 22, posName: '중위 레프트(ML)' },
    { x: 74, y: 50, posName: '중위 센터(MC/세터)' },
    { x: 74, y: 78, posName: '중위 라이트(MR)' },
    // 후위 (Back Row)
    { x: 86, y: 22, posName: '후위 레프트(BL)' },
    { x: 86, y: 50, posName: '후위 센터(BC)' },
    { x: 86, y: 78, posName: '후위 라이트(BR/서버)' }
  ];

  const courtAPos = is9Man ? courtAPositions9 : courtAPositions6;
  const courtBPos = is9Man ? courtBPositions9 : courtBPositions6;

  const renderPlayer = (charId, coords, isTeamA, isServing, index) => {
    const char = charMap.get(charId);
    if (!char) return null;

    const teamColor = isTeamA ? teamA.primaryColor : teamB.primaryColor;
    const isLibero = !is9Man && char.position === 'L'; // 9인제에는 공식 리베로 없음
    const avatarSize = is9Man ? 34 : 42; // 9인제는 9명이므로 약간 컴팩트하게

    return (
      <div
        key={`${char.id}_${index}`}
        className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out z-20 flex flex-col items-center"
        style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
      >
        {/* 서브 차례 표시 */}
        {isServing && (
          <span className="animate-bounce mb-0.5 px-1.5 py-0.2 bg-haikyu-yellow text-black text-[8px] font-black rounded-full shadow">
            서브!
          </span>
        )}

        {/* 선수 아바타 */}
        <div
          className={`relative rounded-full p-0.5 border-2 transition-transform duration-200 hover:scale-125 ${
            isLibero
              ? 'border-yellow-400 bg-yellow-950/80'
              : isTeamA
              ? 'border-haikyu-orange bg-black/60'
              : 'border-red-500 bg-black/60'
          }`}
        >
          <CharacterAvatar
            appearance={char.appearance}
            number={char.number}
            teamColor={isLibero ? '#EAB308' : teamColor}
            secondaryColor="#111"
            size={avatarSize}
          />

          {/* 포지션 뱃지 */}
          <span
            className={`absolute -bottom-1 -right-1 text-[8px] font-black px-1 rounded shadow ${
              isLibero ? 'bg-yellow-400 text-black' : isTeamA ? 'bg-haikyu-orange text-white' : 'bg-red-600 text-white'
            }`}
          >
            {char.position}
          </span>
        </div>

        {/* 이름 태그 */}
        <div className="mt-0.5 px-1 py-0.2 bg-black/85 rounded border border-gray-700 text-[9px] font-bold text-white whitespace-nowrap shadow">
          {char.name.split(' ')[0]}
        </div>
      </div>
    );
  };

  const startersA = teamA.starterIds.slice(0, is9Man ? 9 : 6);
  const startersB = teamB.starterIds.slice(0, is9Man ? 9 : 6);

  return (
    <div className="relative w-full aspect-[16/9] max-h-[520px] bg-[#224422] rounded-2xl overflow-hidden border-4 border-[#121316] shadow-haikyu-lg select-none">
      {/* 바닥 코트: 하이큐 체육관 목재 마루 느낌 텍스처 */}
      <div
        className="absolute inset-0 bg-[#c78842]"
        style={{
          backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(0deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* 만화 스피드 라인 오버레이 */}
      <div className="absolute inset-0 bg-speed-lines opacity-15 pointer-events-none" />

      {/* 아웃사이드 코트 (녹색 마루 외곽 영역) */}
      <div className="absolute inset-4 sm:inset-6 border-4 border-white/90 bg-[#c07d35] shadow-inner">
        {/* 네트 (중앙 분할선) */}
        <div className="absolute top-0 bottom-0 left-1/2 w-3 -translate-x-1/2 z-30 flex flex-col justify-between items-center pointer-events-none">
          {/* 네트 상단 밴드 */}
          <div className="w-full h-full bg-white/95 border-x-2 border-black/40 relative shadow-lg">
            <div
              className="w-full h-full opacity-60"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, #111, #111 2px, transparent 2px, transparent 10px)'
              }}
            />
            <div className="absolute -top-4 left-0 w-1.5 h-6 bg-red-600 border border-white" />
            <div className="absolute -bottom-4 left-0 w-1.5 h-6 bg-red-600 border border-white" />
          </div>
        </div>

        {/* 3m 어택 라인 (Attack Line) */}
        <div className="absolute top-0 bottom-0 left-[33.3%] w-1 bg-white/80 border-r border-dashed border-gray-400" />
        <div className="absolute top-0 bottom-0 right-[33.3%] w-1 bg-white/80 border-l border-dashed border-gray-400" />

        {/* 9인제 전용 중위 구분 보조선 (Middle Line 점선) */}
        {is9Man && (
          <>
            <div className="absolute top-0 bottom-0 left-[20%] w-0.5 border-r border-dotted border-white/40 pointer-events-none" />
            <div className="absolute top-0 bottom-0 right-[20%] w-0.5 border-l border-dotted border-white/40 pointer-events-none" />
          </>
        )}

        {/* 코트 바닥 라벨 */}
        <div className="absolute top-2 left-3 flex items-center gap-2">
          <span className="text-[11px] font-black tracking-widest text-black/50 uppercase">
            {teamA.name}
          </span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-black/60 text-amber-300">
            {is9Man ? '9인제 포메이션' : '6인제 포메이션'}
          </span>
        </div>
        <div className="absolute top-2 right-3 flex items-center gap-2">
          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-black/60 text-red-300">
            {is9Man ? '9인제 포메이션' : '6인제 포메이션'}
          </span>
          <span className="text-[11px] font-black tracking-widest text-black/50 uppercase">
            {teamB.name}
          </span>
        </div>

        {/* 9인제 3열 포메이션 라벨 안내 */}
        {is9Man && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-black text-black/60 tracking-wider flex items-center gap-4 pointer-events-none">
            <span>후위 (Back 3)</span>
            <span>중위 (Middle 3)</span>
            <span className="font-bold text-black/80">전위 (Front 3)</span>
            <span>|</span>
            <span className="font-bold text-black/80">전위 (Front 3)</span>
            <span>중위 (Middle 3)</span>
            <span>후위 (Back 3)</span>
          </div>
        )}

        {/* Team A 선수들 배치 */}
        {startersA.map((charId, idx) => {
          const slot = is9Man ? idx : (rotationA[idx % 6] ?? idx);
          const coords = courtAPos[slot] || courtAPos[0];
          const isServing = servingTeam === 'teamA' && (is9Man ? slot === 8 : slot === 0);
          return renderPlayer(charId, coords, true, isServing, idx);
        })}

        {/* Team B 선수들 배치 */}
        {startersB.map((charId, idx) => {
          const slot = is9Man ? idx : (rotationB[idx % 6] ?? idx);
          const coords = courtBPos[slot] || courtBPos[0];
          const isServing = servingTeam === 'teamB' && (is9Man ? slot === 8 : slot === 0);
          return renderPlayer(charId, coords, false, isServing, idx);
        })}

        {/* 배구공 (Volleyball) 및 비행 궤적 애니메이션 */}
        <div
          className="absolute z-40 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ease-out"
          style={{
            left: `${ballPos.x}%`,
            top: `${ballPos.y}%`
          }}
        >
          {/* 공 그림자 */}
          <div
            className="absolute rounded-full bg-black/40 blur-[2px] transition-all"
            style={{
              width: `${18 + ballPos.z * 0.2}px`,
              height: `${8 + ballPos.z * 0.1}px`,
              top: `${14 + ballPos.z * 0.5}px`,
              left: '2px'
            }}
          />

          {/* 배구공 본체 */}
          <div
            className="relative w-7 h-7 rounded-full bg-[#FFD600] border-2 border-black shadow-md flex items-center justify-center overflow-hidden animate-spin"
            style={{
              animationDuration: '0.8s',
              transform: `scale(${1 + ballPos.z * 0.01})`
            }}
          >
            <div className="absolute w-8 h-2.5 bg-[#1565C0] rotate-45 border-y border-black" />
            <div className="absolute w-8 h-2.5 bg-[#1565C0] -rotate-45 border-y border-black" />
          </div>

          {ballPos.state === 'spike' && (
            <div className="absolute -inset-4 bg-yellow-400/30 rounded-full animate-ping pointer-events-none" />
          )}
          {ballPos.state === 'block' && (
            <div className="absolute -inset-6 bg-red-500/40 rounded-full animate-ping pointer-events-none" />
          )}
        </div>

        {/* 액션 텍스트 팝업 */}
        {activeAction && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className="animate-impact-shake text-center">
              <span
                className="inline-block px-4 py-1.5 rounded-lg text-lg sm:text-2xl font-black haikyu-title tracking-wider shadow-haikyu-lg transform -rotate-3"
                style={{
                  backgroundColor: activeAction.color || '#FF5722',
                  color: '#FFFFFF',
                  border: '3px solid #000'
                }}
              >
                {activeAction.text}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
