import React from 'react';

/**
 * 하이큐 풍 카툰 벡터 캐릭터 아바타 (SVG 기반)
 * 머리 스타일, 눈매, 피부색, 유니폼 색/번호, 악세서리 커스터마이징 지원
 */
export default function CharacterAvatar({
  appearance = {},
  number = 10,
  teamColor = '#FF5722',
  secondaryColor = '#171717',
  size = 120,
  className = ''
}) {
  const {
    hairStyle = 'spiky',
    hairColor = '#FF6D00',
    skinTone = '#FCD34D',
    eyeType = 'fierce',
    accessory = 'none'
  } = appearance;

  // 헤어스타일 SVG 패스
  const renderHair = () => {
    switch (hairStyle) {
      case 'spiky': // 히나타 스타일
        return (
          <path
            d="M 28 42 C 20 25 25 10 38 15 C 44 6 58 4 64 12 C 72 2 86 6 90 18 C 102 12 108 26 102 42 C 108 45 106 58 98 62 C 95 64 88 56 86 52 C 78 52 74 44 64 45 C 54 44 48 52 42 52 C 40 56 32 64 30 60 C 24 55 24 45 28 42 Z"
            fill={hairColor}
            stroke="#111116"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        );
      case 'straight': // 카게야마 스타일
        return (
          <g>
            <path
              d="M 30 46 C 30 20 40 12 64 12 C 88 12 98 20 98 46 C 98 58 94 65 92 65 C 88 56 82 52 74 54 C 68 50 60 50 54 54 C 46 52 40 56 36 65 C 34 65 30 58 30 46 Z"
              fill={hairColor}
              stroke="#111116"
              strokeWidth="3.5"
            />
            {/* 이마 앞머리 갈래 */}
            <path
              d="M 50 42 L 56 56 L 62 43 L 68 57 L 76 43"
              fill="none"
              stroke="#111116"
              strokeWidth="2.5"
            />
          </g>
        );
      case 'rooster': // 쿠로오 스타일 (비대칭 닭벼슬)
        return (
          <path
            d="M 28 45 C 22 30 28 15 42 16 C 46 8 58 2 72 4 C 84 6 104 10 110 28 C 114 40 106 54 98 60 C 92 64 86 50 78 48 C 66 46 56 52 46 52 C 38 52 32 62 28 45 Z"
            fill={hairColor}
            stroke="#111116"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        );
      case 'pudding': // 켄마 투톤 푸딩 스타일
        return (
          <g>
            {/* 아래쪽 브라운/블랙 뿌리 */}
            <path
              d="M 32 40 C 32 18 45 10 64 10 C 83 10 96 18 96 40 C 96 66 90 70 88 70 C 82 58 76 54 64 54 C 52 54 46 58 40 70 C 38 70 32 66 32 40 Z"
              fill="#18181B"
              stroke="#111116"
              strokeWidth="3.5"
            />
            {/* 위쪽 골드 블론드 투톤 */}
            <path
              d="M 36 38 C 36 22 46 14 64 14 C 82 14 92 22 92 38 C 90 48 84 50 64 50 C 44 50 38 48 36 38 Z"
              fill={hairColor}
            />
          </g>
        );
      case 'pompadour': // 보쿠토 / 니시노야 스타일
        return (
          <path
            d="M 30 48 C 26 28 35 12 50 8 C 55 2 73 2 78 8 C 93 12 102 28 98 48 C 96 60 90 56 86 52 C 78 50 72 44 64 44 C 56 44 50 50 42 52 C 38 56 32 60 30 48 Z"
            fill={hairColor}
            stroke="#111116"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        );
      case 'buzz': // 타나카 반삭 스타일
        return (
          <path
            d="M 34 46 C 34 26 44 18 64 18 C 84 18 94 26 94 46 C 94 52 92 56 88 56 C 82 50 74 48 64 48 C 54 48 46 50 40 56 C 36 56 34 52 34 46 Z"
            fill={hairColor}
            stroke="#111116"
            strokeWidth="3"
          />
        );
      default: // shortCurly / curly
        return (
          <path
            d="M 30 45 C 26 32 30 18 42 16 C 50 10 60 12 64 16 C 70 10 82 10 88 16 C 98 18 102 32 98 45 C 94 56 86 54 80 50 C 72 50 68 46 64 46 C 60 46 56 50 48 50 C 42 54 34 56 30 45 Z"
            fill={hairColor}
            stroke="#111116"
            strokeWidth="3.5"
          />
        );
    }
  };

  // 눈매 SVG
  const renderEyes = () => {
    switch (eyeType) {
      case 'sharp': // 카게야마 / 쿠로오 날카로운 눈매
        return (
          <g>
            {/* 눈썹 */}
            <path d="M 44 56 L 56 60" stroke="#111116" strokeWidth="3" strokeLinecap="round" />
            <path d="M 84 56 L 72 60" stroke="#111116" strokeWidth="3" strokeLinecap="round" />
            {/* 눈동자 */}
            <path d="M 44 63 Q 50 61 56 65" stroke="#111116" strokeWidth="3" fill="none" />
            <circle cx="51" cy="65" r="2.5" fill="#111116" />
            <path d="M 84 63 Q 78 61 72 65" stroke="#111116" strokeWidth="3" fill="none" />
            <circle cx="77" cy="65" r="2.5" fill="#111116" />
          </g>
        );
      case 'cat': // 켄마 고양이 눈
        return (
          <g>
            <path d="M 44 57 Q 51 58 56 58" stroke="#111116" strokeWidth="2.5" />
            <path d="M 84 57 Q 77 58 72 58" stroke="#111116" strokeWidth="2.5" />
            <ellipse cx="50" cy="64" rx="2" ry="4" fill="#111116" />
            <ellipse cx="78" cy="64" rx="2" ry="4" fill="#111116" />
          </g>
        );
      case 'glasses': // 츠키시마 스포츠 고글/안경
        return (
          <g>
            <rect x="42" y="58" width="16" height="12" rx="3" fill="rgba(255,255,255,0.4)" stroke="#111116" strokeWidth="2.5" />
            <rect x="70" y="58" width="16" height="12" rx="3" fill="rgba(255,255,255,0.4)" stroke="#111116" strokeWidth="2.5" />
            <line x1="58" y1="64" x2="70" y2="64" stroke="#111116" strokeWidth="2.5" />
            <circle cx="50" cy="64" r="2.5" fill="#111116" />
            <circle cx="78" cy="64" r="2.5" fill="#111116" />
          </g>
        );
      case 'calm': // 차분한 눈매
        return (
          <g>
            <path d="M 44 58 Q 50 56 56 58" stroke="#111116" strokeWidth="2.5" />
            <path d="M 84 58 Q 78 56 72 58" stroke="#111116" strokeWidth="2.5" />
            <circle cx="50" cy="64" r="3" fill="#111116" />
            <circle cx="78" cy="64" r="3" fill="#111116" />
          </g>
        );
      default: // fierce: 히나타의 불타는 호승심 눈매
        return (
          <g>
            {/* 역동적 눈썹 */}
            <path d="M 42 56 L 56 61" stroke="#111116" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 86 56 L 72 61" stroke="#111116" strokeWidth="3.5" strokeLinecap="round" />
            {/* 눈 */}
            <circle cx="50" cy="64" r="4.5" fill="#111116" />
            <circle cx="49" cy="63" r="1.5" fill="#FFFFFF" />
            <circle cx="78" cy="64" r="4.5" fill="#111116" />
            <circle cx="77" cy="63" r="1.5" fill="#FFFFFF" />
          </g>
        );
    }
  };

  return (
    <div
      className={`relative inline-block select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 128 128"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 뒤쪽 만화풍 스피드 이펙트 또는 원형 후광 */}
        <circle cx="64" cy="64" r="60" fill="#1E2129" stroke="#000" strokeWidth="3" />
        <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="4 4" />

        {/* 상체 / 어깨 및 유니폼 */}
        <g id="body">
          {/* 목 */}
          <rect x="56" y="78" width="16" height="16" fill={skinTone} stroke="#111116" strokeWidth="3" />

          {/* 유니폼 몸통 */}
          <path
            d="M 30 118 L 36 86 C 42 85 52 88 64 88 C 76 88 86 85 92 86 L 98 118 Z"
            fill={teamColor}
            stroke="#111116"
            strokeWidth="3.5"
          />

          {/* 브이넥 깃 & 배색 */}
          <path
            d="M 52 86 L 64 99 L 76 86"
            fill="none"
            stroke={secondaryColor}
            strokeWidth="4"
          />

          {/* 등번호/가슴번호 */}
          <text
            x="64"
            y="114"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="18"
            fontWeight="900"
            fontFamily="'Impact', 'Black Han Sans', sans-serif"
            stroke="#000000"
            strokeWidth="1"
          >
            {number}
          </text>
        </g>

        {/* 얼굴 윤곽 */}
        <g id="head">
          {/* 귀 */}
          <circle cx="36" cy="68" r="6" fill={skinTone} stroke="#111116" strokeWidth="2.5" />
          <circle cx="92" cy="68" r="6" fill={skinTone} stroke="#111116" strokeWidth="2.5" />

          {/* 턱선 */}
          <path
            d="M 38 52 C 38 78 50 86 64 86 C 78 86 90 78 90 52 Z"
            fill={skinTone}
            stroke="#111116"
            strokeWidth="3.5"
          />

          {/* 코 */}
          <path d="M 64 68 L 62 72 L 65 72" stroke="#111116" strokeWidth="2" strokeLinecap="round" />

          {/* 입 (하이큐 특유의 자신감 넘치는 미소/기합) */}
          <path d="M 58 77 Q 64 81 70 77" stroke="#111116" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* 눈매 */}
          {renderEyes()}
        </g>

        {/* 헤어스타일 */}
        <g id="hair">{renderHair()}</g>

        {/* 악세서리 (예: 이마 땀방울, 반창고 등) */}
        {accessory === 'wristBand' && (
          <rect x="22" y="104" width="8" height="12" rx="2" fill="#FF5722" stroke="#000" strokeWidth="1.5" />
        )}
      </svg>
    </div>
  );
}

