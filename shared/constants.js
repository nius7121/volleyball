// 9인제 코트 자리와 경기 규칙 상수. 서버, 엔진, 화면이 함께 쓴다.

// d: 네트(0) ~ 엔드라인(1), l: 팀 기준 왼쪽(0) ~ 오른쪽(1)
export const SLOTS = [
  { id: 'FL', label: '전위 레프트', short: '전좌', row: 'front', d: 0.2, l: 0.18, role: 'WS' },
  { id: 'FC', label: '전위 센터', short: '전중', row: 'front', d: 0.2, l: 0.5, role: 'MB' },
  { id: 'FR', label: '전위 라이트', short: '전우', row: 'front', d: 0.2, l: 0.82, role: 'WS' },
  { id: 'ML', label: '중위 레프트', short: '중좌', row: 'mid', d: 0.52, l: 0.18, role: 'DS' },
  { id: 'MC', label: '중위 센터', short: '중중', row: 'mid', d: 0.52, l: 0.5, role: 'S' },
  { id: 'MR', label: '중위 라이트', short: '중우', row: 'mid', d: 0.52, l: 0.82, role: 'DS' },
  { id: 'BL', label: '후위 레프트', short: '후좌', row: 'back', d: 0.84, l: 0.18, role: 'DS' },
  { id: 'BC', label: '후위 센터', short: '후중', row: 'back', d: 0.84, l: 0.5, role: 'DS' },
  { id: 'BR', label: '후위 라이트', short: '후우', row: 'back', d: 0.84, l: 0.82, role: 'DS' },
];

export const SLOT_BY_ID = Object.fromEntries(SLOTS.map((s) => [s.id, s]));

export const ROLES = {
  WS: { name: '공격수', desc: '스파이크로 점수를 내요' },
  MB: { name: '블로커', desc: '네트 앞에서 상대 공격을 막아요' },
  S: { name: '세터', desc: '공격수에게 토스를 올려요' },
  DS: { name: '수비수', desc: '리시브와 디그를 책임져요' },
};

export const ROLE_IDS = Object.keys(ROLES);

// 머리 모양은 캐릭터 모습에 따라 고른다.
export const HAIR_BY_LOOK = {
  boy: [
    ['spiky', '뾰족머리'], ['straight', '직모'], ['rooster', '옆으로 뻗친 머리'], ['pudding', '투톤'],
    ['pompadour', '올린 앞머리'], ['shortCurly', '짧은 곱슬'], ['buzz', '짧은 머리'], ['ponytail', '꽁지머리'],
  ],
  girl: [
    ['longStraight', '긴 생머리'], ['bob', '단발'], ['highPonytail', '높은 포니테일'], ['sideTail', '옆으로 묶은 머리'],
    ['shortCut', '숏컷'], ['twinTail', '양갈래'], ['bun', '올림머리'], ['wavy', '긴 웨이브'],
  ],
};

export const RULES = {
  starters: 9,
  setsToWin: 2,
  subsPerSet: 6,
  timeoutsPerSet: 2,
  maxTouches: 3,
  maxTouchesAfterNet: 4,
  serveTries: 2,
};

export const FORMATS = {
  mini: { id: 'mini', name: '수업형', target: 11, sideChange: 6, desc: '11점 3세트 2선승' },
  short: { id: 'short', name: '단축형', target: 15, sideChange: 8, desc: '15점 3세트 2선승' },
  regular: { id: 'regular', name: '정규형', target: 21, sideChange: 11, desc: '21점 3세트 2선승' },
};

export const TIME_LIMITS = {
  tacticsMs: 10 * 60 * 1000,
  timeoutMs: 60 * 1000,
  setBreakMs: 60 * 1000,
};
