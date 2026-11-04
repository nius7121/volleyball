import React, { useId } from 'react';
import { HAIR_BY_LOOK } from '../../shared/constants.js';

/**
 * 만화풍 선수 상반신 (SVG).
 * 얼굴과 어깨, 눈매, 머리 모양이 look('boy' | 'girl')에 따라 달라진다.
 * 뾰족한 선은 miter 이음으로 살리고, 명암은 그라데이션 없이 면으로 나눈다.
 */

const INK = '#16161A';

export function shiftColor(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `rgb(${r},${g},${b})`;
}

/* 머리 모양: back은 얼굴 뒤, front는 얼굴 앞에 그린다 */
const HAIR = {
  // 남자 머리
  spiky: {
    front: 'M41 60 L37 42 L27 38 L37 31 L33 17 L46 24 L50 7 L60 19 L71 5 L76 20 L91 11 L88 26 L101 28 L91 38 L91 46 L87 60 L84 47 L78 54 L74 43 L66 52 L62 42 L54 52 L52 43 L46 52 Z',
  },
  straight: {
    front: 'M41 62 L38 36 Q42 16 64 15 Q86 16 90 36 L87 62 L84 47 L79 55 L75 44 L68 54 L64 43 L56 54 L52 44 L46 55 Z',
  },
  rooster: {
    front: 'M41 62 L37 40 L29 31 L42 27 L40 13 L56 18 L66 5 L75 16 L96 9 L91 24 L104 28 L93 39 L87 62 L85 47 L71 41 L59 54 L51 43 L46 54 Z',
  },
  pudding: {
    front: 'M41 66 L38 38 Q42 15 64 14 Q86 15 90 38 L87 66 L84 50 L78 60 L74 47 L66 58 L62 46 L54 58 L51 47 L46 60 Z',
    root: 'M38 38 Q42 15 64 14 Q86 15 90 38 L82 36 L74 40 L64 35 L54 40 L46 36 Z',
  },
  pompadour: {
    front: 'M41 60 L39 38 Q41 25 50 21 L43 9 L62 14 L81 5 L85 18 L93 25 Q91 40 87 60 L84 45 Q71 36 58 41 Q48 43 45 48 Z',
  },
  shortCurly: {
    front: 'M41 60 Q33 48 38 40 Q29 30 42 28 Q39 15 54 20 Q60 9 70 18 Q85 11 86 26 Q99 30 90 40 Q95 49 87 60 Q86 49 80 49 Q76 56 70 49 Q64 56 58 49 Q52 56 48 49 Q42 49 41 60 Z',
  },
  buzz: {
    front: 'M43 56 L41 38 Q46 20 64 20 Q82 20 87 38 L85 56 L82 43 L74 39 L64 41 L54 39 L46 43 Z',
  },
  ponytail: {
    back: 'M70 22 L96 12 L106 22 L101 26 L108 40 L97 34 L96 46 L88 32 Z',
    front: 'M41 60 L39 38 Q44 18 64 17 Q84 18 89 38 L87 60 L84 45 L76 50 L72 41 L62 50 L58 41 L50 50 L46 47 Z',
  },
  // 여자 머리
  longStraight: {
    back: 'M42 40 L86 40 L98 122 L86 112 L80 124 L48 124 L42 112 L30 122 Z',
    front: 'M44 66 L40 42 Q45 20 64 18 Q83 20 88 42 L84 66 L82 48 L76 53 L71 44 L63 53 L57 44 L51 53 L46 48 Z',
  },
  bob: {
    back: 'M42 40 L86 40 L95 88 L84 94 L80 84 L48 84 L44 94 L33 88 Z',
    front: 'M44 70 L40 42 Q45 19 64 17 Q83 19 88 42 L84 70 L82 53 L78 52 L72 54 L66 51 L60 54 L54 51 L49 54 L46 53 Z',
  },
  highPonytail: {
    back: 'M72 20 Q100 2 110 26 L118 70 L106 60 L104 80 L94 60 L88 34 Z',
    front: 'M43 72 L40 42 Q45 19 64 17 Q83 19 88 42 L85 72 L82 50 L72 42 L60 54 L50 44 L46 52 Z',
  },
  sideTail: {
    back: 'M90 34 Q108 40 108 66 L112 100 L100 92 L96 106 L90 84 L84 50 Z',
    front: 'M43 70 L40 42 Q45 19 64 17 Q83 19 88 42 L85 66 L83 48 L74 42 L66 52 L56 43 L50 53 L46 50 Z',
  },
  shortCut: {
    back: 'M42 40 L86 40 L89 76 L78 70 L50 70 L39 76 Z',
    front: 'M44 72 L40 42 Q45 19 64 17 Q83 19 88 42 L84 70 L83 50 L70 40 L58 52 L52 44 L46 54 Z',
  },
  twinTail: {
    back: 'M42 30 Q18 30 16 58 L10 98 L22 88 L24 106 L34 84 L42 50 Z M86 30 Q110 30 112 58 L118 98 L106 88 L104 106 L94 84 L86 50 Z',
    front: 'M44 68 L40 42 Q45 19 64 17 Q83 19 88 42 L84 68 L82 49 L76 53 L70 45 L63 53 L57 45 L51 53 L46 49 Z',
  },
  bun: {
    back: 'M52 18 Q50 2 64 2 Q78 2 76 18 Z',
    front: 'M44 76 L40 42 Q45 18 64 16 Q83 18 88 42 L84 76 L82 52 L72 44 L58 52 L50 44 L46 52 Z',
  },
  wavy: {
    back: 'M42 40 L86 40 Q100 62 94 74 Q104 88 94 100 Q100 112 88 120 L40 120 Q28 112 34 100 Q24 88 34 74 Q28 62 42 40 Z',
    front: 'M44 68 L40 42 Q45 20 64 17 Q83 20 88 42 L84 68 L82 48 L72 42 Q66 50 58 47 Q50 50 46 50 Z',
  },
};

/* 왼쪽 눈 기준. 오른쪽은 좌우를 뒤집어 그린다. */
function Eye({ type, isGirl, skinShade }) {
  const ink = { fill: INK };
  if (type === 'glasses') {
    return (
      <g>
        <path d={isGirl ? 'M45 58 L58 60 L58 62 L45 60.5 Z' : 'M44 57 L59 60 L59 62.5 L44 59.5 Z'} {...ink} />
        <path d="M47 66.5 L58 67 L57 73 L49 73 Z" fill="#fff" />
        <path d="M47 66.5 L58 67 L58 68.6 L47.5 68.2 Z" {...ink} />
        <circle cx="53" cy="70" r={isGirl ? 3.2 : 2.7} {...ink} />
      </g>
    );
  }
  const shapes = {
    fierce: {
      brow: isGirl ? 'M45 59 L59 62 L59 64 L45.5 61 Z' : 'M43 55 L60 62 L60 65 L44 58.5 Z',
      white: isGirl ? 'M46 67 L51 63.5 L59 67 L58 73.5 L50 74.5 Z' : 'M47 66.5 L51 65 L59.5 68.5 L57.5 73 L50.5 72.5 Z',
      lid: isGirl ? 'M44 67.5 L51 62.5 L60 66.5 L59.5 68.6 L51 65 L46.5 68.5 Z' : 'M45.5 66.5 L51 64 L60.5 68 L60 70 L51 66.5 L47 67.8 Z',
      iris: [53.5, 69.3, isGirl ? 4.1 : 3.1],
    },
    sharp: {
      brow: isGirl ? 'M45 60 L59 61.5 L59 63.5 L45 62 Z' : 'M43 57 L60 62.5 L60 65 L43.5 60 Z',
      white: isGirl ? 'M46 68 L51 65.5 L59 68 L57.5 72.5 L50 73 Z' : 'M47 68.5 L51 67 L59.5 69.5 L57.5 72.5 L50.5 72.3 Z',
      lid: isGirl ? 'M43.5 68.5 L51 64.5 L60 67.5 L59.5 69.5 L51 66.8 L46 69.4 Z' : 'M45 68.5 L51 66 L60.5 69 L60 71 L51 68.2 L47 69.6 Z',
      iris: [54, 69.8, isGirl ? 3.3 : 2.5],
    },
    calm: {
      brow: isGirl ? 'M45 60.5 Q52 58.5 59 61 L59 62.8 Q52 60.5 45 62.2 Z' : 'M44 60 Q52 58 60 61 L60 63.2 Q52 60.4 44 62.2 Z',
      white: isGirl ? 'M46.5 68 Q52 63.5 58.5 68 L57.5 74 L49.5 74 Z' : 'M47.5 68.5 Q53 65.5 59 68.5 L57.5 73 L50 73 Z',
      lid: isGirl ? 'M45 68.5 Q52 62 60 68 L59.5 69.6 Q52 65 46.5 69.2 Z' : 'M46 68.8 Q53 64.2 60.5 68.5 L60 70.2 Q53 66.6 47.5 69.6 Z',
      iris: [53, 69.8, isGirl ? 3.9 : 3],
    },
    cat: {
      brow: isGirl ? 'M45 60 L59 60.5 L59 62.3 L45 61.8 Z' : 'M44 59.5 L60 60.5 L60 62.6 L44 61.6 Z',
      white: isGirl ? 'M45.5 66 L52 66 L59 69 L57 73.5 L50 73 Z' : 'M46.5 66.5 L52 66.8 L59.5 69.5 L57.5 73 L50.5 72.5 Z',
      lid: isGirl ? 'M43 64.5 L52 64.8 L60 68 L59.5 70 L52 67.2 L46 67.4 Z' : 'M44.5 65 L52 65.6 L60.5 68.8 L60 70.8 L52 67.8 L47 67.8 Z',
      iris: [53.5, 69.8, isGirl ? 3 : 2.3],
    },
  };
  const s = shapes[type] ?? shapes.fierce;
  const [cx, cy, r] = s.iris;
  return (
    <g>
      <path d={s.brow} {...ink} />
      <path d={s.white} fill="#fff" />
      <circle cx={cx} cy={cy} r={r} {...ink} />
      <path d={s.lid} {...ink} />
      {isGirl && <path d="M44.5 67 L41.5 64.5 L45.5 65 Z M46.5 64.8 L44 61.8 L48 63.5 Z" {...ink} />}
      <path d="M48 75.5 L55 75.5" stroke={skinShade} strokeWidth="1" />
    </g>
  );
}

function Mouth({ type, isGirl }) {
  if (type === 'fierce') {
    return (
      <g>
        <path d={isGirl ? 'M59 83 L69 83 L66.5 87 L61 87 Z' : 'M57 82.5 L71 81.5 L68 87.5 L60 87.5 Z'} fill="#7F1D1D" stroke={INK} strokeWidth="1.6" strokeLinejoin="miter" />
        <path d={isGirl ? 'M60 83.3 L68 83.3 L67.3 84.6 L60.8 84.6 Z' : 'M58.5 82.8 L69.6 82 L68.8 83.8 L59.3 84.4 Z'} fill="#fff" />
      </g>
    );
  }
  if (type === 'cat') return <path d="M59 84 L64 85.5 L70 82.5" stroke={INK} strokeWidth="1.8" fill="none" />;
  if (type === 'sharp') return <path d="M59 84.5 L69 83.5" stroke={INK} strokeWidth="2" fill="none" />;
  return <path d={isGirl ? 'M60 84 Q64 86.5 68 84' : 'M59 84.5 Q64 85.8 69 84'} stroke={INK} strokeWidth="1.8" fill="none" />;
}

const LINE = { stroke: INK, strokeWidth: 2.4, strokeLinejoin: 'miter', strokeMiterlimit: 8 };

const hairOf = (appearance) => {
  const look = appearance.look ?? 'boy';
  return HAIR[appearance.hairStyle] ?? HAIR[HAIR_BY_LOOK[look]?.[0]?.[0]] ?? HAIR.spiky;
};

/* 얼굴 뒤로 내려오는 머리. 몸보다 먼저 그린다. */
export function HairBack({ appearance = {} }) {
  const hair = hairOf(appearance);
  if (!hair.back) return null;
  const hairColor = appearance.hairColor ?? '#18181B';
  return (
    <>
      <path d={hair.back} fill={hairColor} {...LINE} />
      <path d={hair.back} fill={shiftColor(hairColor, -0.35)} opacity="0.35" />
    </>
  );
}

/* 귀, 얼굴, 눈, 입, 앞머리. 128 칸 기준 좌표로 그리므로 쓰는 쪽에서 크기와 위치를 잡는다. */
export function HeadFace({ appearance = {} }) {
  const {
    look = 'boy',
    hairColor = '#18181B',
    skinTone = '#FDE68A',
    eyeType = 'fierce',
  } = appearance;
  const clipId = `head${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const isGirl = look === 'girl';
  const hair = hairOf(appearance);
  const skinShade = shiftColor(skinTone, -0.2);
  const hairShade = shiftColor(hairColor, -0.35);
  const hairLight = shiftColor(hairColor, 0.38);

  const face = isGirl
    ? 'M45 34 L45 68 Q46 77 53 84 Q60 91 64 91.5 Q68 91 75 84 Q82 77 83 68 L83 34 Z'
    : 'M43 34 L43 67 L46 76 L55 86 L64 94 L73 86 L82 76 L85 67 L85 34 Z';
  const faceShadow = isGirl
    ? 'M83 60 L83 68 Q82 77 75 84 Q70 89 66 91 Q74 82 78 72 Z'
    : 'M85 60 L85 67 L82 76 L73 86 L66 92.5 L74 80 L80 70 Z';

  return (
    <g>
      <defs>
        <clipPath id={`${clipId}face`}><path d={face} /></clipPath>
        <clipPath id={`${clipId}hair`}><path d={hair.front} /></clipPath>
      </defs>
      {/* 귀 */}
      <path d={isGirl ? 'M45 64 L41 62 L42 71 L46 74 Z M83 64 L87 62 L86 71 L82 74 Z' : 'M43 62 L38 59 L39 71 L44 76 Z M85 62 L90 59 L89 71 L84 76 Z'} fill={skinTone} {...LINE} />

      {/* 얼굴 */}
      <path d={face} fill={skinTone} {...LINE} />
      <path d={faceShadow} fill={skinShade} />
      {/* 앞머리가 얼굴에 드리우는 그림자: 앞머리 모양을 그대로 아래로 내려 얼굴 안에만 그린다 */}
      <g clipPath={`url(#${clipId}face)`}>
        <path d={hair.front} fill={skinShade} transform="translate(0 3.5)" />
      </g>

      <g><Eye type={eyeType} isGirl={isGirl} skinShade={skinShade} /></g>
      <g transform="translate(128 0) scale(-1 1)"><Eye type={eyeType} isGirl={isGirl} skinShade={skinShade} /></g>
      {eyeType !== 'glasses' && (
        <path d={isGirl ? 'M50.5 66 L53 65.5 L52.5 68.5 Z M77.5 66 L75 65.5 L75.5 68.5 Z' : 'M52 67 L54 66.6 L53.6 68.6 Z M76 67 L74 66.6 L74.4 68.6 Z'} fill="#fff" />
      )}
      {eyeType === 'glasses' && (
        <g stroke={INK} strokeWidth="1.7" fill="#fff" fillOpacity="0.16">
          <path d="M44.5 64.5 L60 65 L59 75.5 L47 75.5 Z" />
          <path d="M83.5 64.5 L68 65 L69 75.5 L81 75.5 Z" />
          <path d="M60 67 L68 67" fill="none" />
        </g>
      )}
      {isGirl && <path d="M47 77 L50 75.5 M50 77 L53 75.5 M78 77 L81 75.5 M75 77 L78 75.5" stroke="#E5563B" strokeWidth="1.2" />}

      {/* 코와 입 */}
      <path d={isGirl ? 'M64.5 75 L63 79 L65 79' : 'M64.5 72 L62 79 L65.5 79'} stroke={INK} strokeWidth="1.4" fill="none" />
      <Mouth type={eyeType} isGirl={isGirl} />
      {!isGirl && eyeType === 'fierce' && <path d="M73 79 L77 77.5" stroke={INK} strokeWidth="1.2" />}

      {/* 앞머리 */}
      <path d={hair.front} fill={hairColor} {...LINE} />
      {hair.root && <path d={hair.root} fill="#18181B" />}
      <g clipPath={`url(#${clipId}hair)`}>
        <path d="M82 10 L110 10 L110 64 L86 64 L84 40 Z" fill={hairShade} opacity="0.75" />
        <path d="M47 33 L58 24 L56 28 L48 35 Z M62 24 L74 22 L71 25 L62 27 Z M77 25 L85 32 L83 33 L76 28 Z" fill={hairLight} />
      </g>
    </g>
  );
}

export default function CharacterAvatar({
  appearance = {},
  number = 10,
  teamColor = '#E9540F',
  secondaryColor = INK,
  size = 120,
  className = '',
}) {
  const { look = 'boy', skinTone = '#FDE68A' } = appearance;
  const clipId = `avatar${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const isGirl = look === 'girl';
  const skinShade = shiftColor(skinTone, -0.2);
  const teamShade = shiftColor(teamColor, -0.25);

  const body = isGirl
    ? 'M24 150 L29 114 Q33 107 45 104 L57 100 L64 110 L71 100 L83 104 Q95 107 99 114 L104 150 Z'
    : 'M12 150 L19 111 Q24 104 40 101 L54 96 L64 110 L74 96 L88 101 Q104 104 109 111 L116 150 Z';
  const sleeveL = isGirl ? 'M29 114 L38 106 L41 150 L24 150 Z' : 'M19 111 L33 103 L36 150 L12 150 Z';
  const sleeveR = isGirl ? 'M99 114 L90 106 L87 150 L104 150 Z' : 'M109 111 L95 103 L92 150 L116 150 Z';

  return (
    <div className={`relative inline-block select-none ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 128 128" className="h-full w-full" style={{ width: '100%', height: '100%' }} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id={clipId}><circle cx="64" cy="64" r="60" /></clipPath>
        </defs>

        <circle cx="64" cy="64" r="60" fill="#FFFDF7" />
        <g clipPath={`url(#${clipId})`}>
          {/* 뒤쪽 속도선 */}
          <path d="M-4 40 L132 12 L132 22 L-4 54 Z M-4 72 L132 42 L132 48 L-4 80 Z" fill={teamColor} opacity="0.16" />

          <g transform="translate(6.4 3) scale(0.9)">
            <HairBack appearance={appearance} />

            {/* 목 */}
            <path d={isGirl ? 'M58 86 L58 101 L64 110 L70 101 L70 86 Z' : 'M55 84 L55 98 L64 110 L73 98 L73 84 Z'} fill={skinTone} {...LINE} />
            <path d={isGirl ? 'M58 88 L70 88 L70 95 L60 93 Z' : 'M55 86 L73 86 L73 94 L58 91 Z'} fill={skinShade} />

            {/* 유니폼 */}
            <path d={body} fill={teamColor} {...LINE} />
            <path d={sleeveR} fill={teamShade} />
            <path d={sleeveL} fill={secondaryColor} opacity="0.9" />
            <path d={sleeveR} fill={secondaryColor} opacity="0.9" />
            <path d={isGirl ? 'M57 100 L64 110 L71 100 L74 102 L64 114 L54 102 Z' : 'M54 96 L64 110 L74 96 L78 98 L64 114 L50 98 Z'} fill={secondaryColor} />
            <text x="64" y="132" textAnchor="middle" fill="#fff" stroke={INK} strokeWidth="1.2" paintOrder="stroke" fontSize="15" fontFamily="'Black Han Sans', sans-serif">
              {number}
            </text>

            <HeadFace appearance={appearance} />
          </g>
        </g>
        <circle cx="64" cy="64" r="60" stroke={INK} strokeWidth="3" />
      </svg>
    </div>
  );
}
