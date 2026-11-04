import React from 'react';
import { HairBack, HeadFace, shiftColor } from './CharacterAvatar';

/**
 * 동작하는 전신 선수 그림 (SVG). 모든 동작은 오른쪽(네트 쪽)을 보고 그렸고 flip으로 뒤집는다.
 * 팔: [어깨, 팔꿈치, 손], 다리: [엉덩이, 무릎, 발], near는 앞쪽 팔다리, far는 뒤쪽 팔다리다.
 */
export const POSES = {
  ready: {
    head: [126, 56, 6], chest: [116, 96], hip: [106, 146],
    nearArm: [[108, 100], [124, 134], [156, 124]], farArm: [[124, 100], [146, 128], [172, 116]],
    nearLeg: [[108, 148], [134, 182], [120, 228]], farLeg: [[102, 148], [84, 186], [74, 228]],
  },
  serve: {
    head: [112, 56, -14], chest: [108, 98], hip: [104, 150],
    nearArm: [[98, 96], [62, 78], [72, 36]], farArm: [[120, 96], [148, 66], [160, 34]],
    nearLeg: [[108, 152], [130, 188], [132, 230]], farLeg: [[100, 152], [78, 188], [52, 226]],
    ball: [168, 14],
  },
  receive: {
    head: [134, 76, 12], chest: [112, 116], hip: [84, 158],
    nearArm: [[112, 122], [146, 142], [182, 154]], farArm: [[120, 118], [154, 134], [188, 148]],
    nearLeg: [[88, 160], [134, 184], [116, 230]], farLeg: [[80, 160], [56, 192], [28, 228]],
    ball: [208, 136],
  },
  set: {
    head: [118, 62, -16], chest: [114, 104], hip: [108, 156],
    nearArm: [[100, 102], [78, 66], [108, 22]], farArm: [[128, 102], [158, 68], [132, 22]],
    nearLeg: [[110, 158], [130, 192], [122, 232]], farLeg: [[104, 158], [88, 194], [78, 232]],
    ball: [120, 2],
  },
  spike: {
    head: [122, 58, -6], chest: [114, 98], hip: [96, 146],
    nearArm: [[106, 92], [148, 62], [186, 26]], farArm: [[122, 104], [86, 92], [52, 70]],
    nearLeg: [[94, 148], [66, 174], [30, 170]], farLeg: [[100, 148], [92, 188], [52, 206]],
    ball: [206, 10],
  },
  block: {
    head: [112, 66, 0], chest: [114, 106], hip: [110, 158],
    nearArm: [[98, 102], [80, 60], [90, 12]], farArm: [[130, 102], [152, 60], [168, 12]],
    nearLeg: [[106, 160], [98, 198], [108, 234]], farLeg: [[116, 160], [130, 198], [124, 234]],
    ball: [208, 14],
  },
  dig: {
    head: [152, 156, 40], chest: [120, 186], hip: [72, 192],
    nearArm: [[122, 194], [166, 208], [212, 208]], farArm: [[124, 184], [170, 192], [214, 194]],
    nearLeg: [[70, 196], [36, 216], [8, 222]], farLeg: [[70, 190], [40, 184], [16, 158]],
    ball: [232, 188],
  },
};

const INK = '#16161A';
const LINE = { stroke: INK, strokeWidth: 2.4, strokeLinejoin: 'round' };

const between = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// 시작과 끝 굵기가 다른 팔다리 조각
function segmentPath(a, b, widthA, widthB) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const at = (p, w, side) => `${(p[0] + nx * (w / 2) * side).toFixed(1)} ${(p[1] + ny * (w / 2) * side).toFixed(1)}`;
  return `M${at(a, widthA, 1)} L${at(b, widthB, 1)} L${at(b, widthB, -1)} L${at(a, widthA, -1)} Z`;
}

function Arm({ joints, width, skin, sleeve }) {
  const [shoulder, elbow, hand] = joints;
  const wS = width * 1.15;
  const wE = width * 0.82;
  const wH = width * 0.55;
  const sleeveEnd = between(shoulder, elbow, 0.5);
  const sleeveW = wS + (wE - wS) * 0.5;
  return (
    <g>
      <path d={segmentPath(shoulder, elbow, wS, wE)} fill={skin} {...LINE} />
      <path d={segmentPath(elbow, hand, wE, wH)} fill={skin} {...LINE} />
      <circle cx={elbow[0]} cy={elbow[1]} r={wE / 2} fill={skin} />
      <path d={segmentPath(shoulder, sleeveEnd, wS + 1, sleeveW + 1)} fill={sleeve} {...LINE} />
      <circle cx={shoulder[0]} cy={shoulder[1]} r={wS / 2 + 1} fill={sleeve} />
      <path d={`M${hand[0] - wH * 0.9} ${hand[1]} a${wH * 0.9} ${wH * 0.9} 0 1 0 ${wH * 1.8} 0 a${wH * 0.9} ${wH * 0.9} 0 1 0 ${-wH * 1.8} 0`} fill={skin} {...LINE} />
    </g>
  );
}

function Leg({ joints, width, skin, shorts }) {
  const [hip, knee, foot] = joints;
  const toe = foot[0] - knee[0] < -22 ? -1 : 1;
  const wH = width * 1.3;
  const wK = width * 0.88;
  const wA = width * 0.55;
  const shortsEnd = between(hip, knee, 0.5);
  const sockStart = between(foot, knee, 0.5);
  return (
    <g>
      <path d={segmentPath(hip, knee, wH, wK)} fill={skin} {...LINE} />
      <path d={segmentPath(knee, foot, wK, wA)} fill={skin} {...LINE} />
      <path d={segmentPath(sockStart, foot, wK * 0.78, wA)} fill="#fff" {...LINE} />
      <path d={segmentPath(hip, shortsEnd, wH + 1, wH * 0.92)} fill={shorts} {...LINE} />
      <circle cx={hip[0]} cy={hip[1]} r={wH / 2 + 1} fill={shorts} />
      {/* 무릎 보호대 */}
      <path d={segmentPath(between(knee, hip, 0.1), between(knee, foot, 0.13), wK + 1.5, wK + 1)} fill="#fff" {...LINE} />
      {/* 운동화 */}
      <path d={`M${foot[0] - 7 * toe} ${foot[1] - 7} L${foot[0] + 18 * toe} ${foot[1] + 1} L${foot[0] + 16 * toe} ${foot[1] + 7} L${foot[0] - 8 * toe} ${foot[1] + 7} Z`} fill={INK} />
    </g>
  );
}

function Torso({ chest, hip, shoulderHalf, waistHalf, color, shorts }) {
  const dx = hip[0] - chest[0];
  const dy = hip[1] - chest[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const side = (base, half) => [[base[0] + nx * half, base[1] + ny * half], [base[0] - nx * half, base[1] - ny * half]];
  const [s1, s2] = side([chest[0] - (dx / len) * 8, chest[1] - (dy / len) * 8], shoulderHalf);
  const [w1, w2] = side(between(chest, hip, 0.82), waistHalf);
  const [h1, h2] = side([hip[0] + (dx / len) * 10, hip[1] + (dy / len) * 10], waistHalf + 2);
  return (
    <g>
      <path d={`M${w1} L${h1} L${h2} L${w2} Z`} fill={shorts} {...LINE} />
      <path d={`M${s1} L${w1} L${w2} L${s2} Z`} fill={color} {...LINE} />
    </g>
  );
}

export default function PoseFigure({ pose = 'ready', appearance = {}, number = 0, teamColor = '#E9540F', flip = false, size = 160, showBall = false, className = '' }) {
  const p = POSES[pose] ?? POSES.ready;
  const isGirl = appearance.look === 'girl';
  const skin = appearance.skinTone ?? '#FDE68A';
  const skinShade = shiftColor(skin, -0.16);
  const armW = isGirl ? 11 : 14;
  const legW = isGirl ? 14 : 17;
  const shorts = '#22222A';
  const teamShade = shiftColor(teamColor, -0.22);
  const headTransform = `translate(${p.head[0]} ${p.head[1]}) rotate(${p.head[2]}) scale(0.68) translate(-64 -66)`;
  const midTorso = between(p.chest, p.hip, 0.42);

  return (
    <svg viewBox="0 0 240 240" width={size} height={size} className={className} style={{ overflow: 'visible', display: 'block' }} fill="none" aria-hidden="true">
      <g transform={flip ? 'translate(240 0) scale(-1 1)' : undefined}>
        <g transform={headTransform}><HairBack appearance={appearance} /></g>
        <Arm joints={p.farArm} width={armW * 0.92} skin={skinShade} sleeve={teamShade} />
        <Leg joints={p.farLeg} width={legW * 0.92} skin={skinShade} shorts={shorts} />
        <Torso chest={p.chest} hip={p.hip} shoulderHalf={isGirl ? 15 : 20} waistHalf={isGirl ? 11 : 14} color={teamColor} shorts={shorts} />
        <Leg joints={p.nearLeg} width={legW} skin={skin} shorts={shorts} />
        <g transform={`translate(${midTorso[0]} ${midTorso[1] + 7}) ${flip ? 'scale(-1 1)' : ''}`}>
          <text textAnchor="middle" fontSize="21" fill="#fff" stroke={INK} strokeWidth="1.4" paintOrder="stroke" fontFamily="'Black Han Sans', sans-serif">{number}</text>
        </g>
        <Arm joints={p.nearArm} width={armW} skin={skin} sleeve={teamColor} />
        <path d={segmentPath(between(p.chest, p.head, 0.42), [p.head[0], p.head[1] + 6], isGirl ? 9 : 12, isGirl ? 8 : 11)} fill={skin} {...LINE} />
        <g transform={headTransform}><HeadFace appearance={appearance} /></g>
        {showBall && p.ball && (
          <g transform={`translate(${p.ball[0]} ${p.ball[1]})`}>
            <circle r="15" fill="#FFE14D" stroke={INK} strokeWidth="2.5" />
            <path d="M-13 7 L13 -7 M-9 -11 Q2 -2 3 13" stroke="#1A5DBF" strokeWidth="3.5" />
          </g>
        )}
      </g>
    </svg>
  );
}
