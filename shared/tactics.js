// 감독이 고르는 9인제 전술과 상성표. 설명 문구와 엔진이 같은 표를 본다.

export const TACTIC_OPTIONS = {
  serveTarget: {
    title: '서브 목표',
    options: [
      { id: 'weak_receiver', name: '약한 리시버 노리기', desc: '리시브가 가장 약한 선수에게 서브를 보냅니다.', tip: '안정적이지만 상대가 수비 위치를 바꾸면 효과가 줄어요.' },
      { id: 'setter_line', name: '세터 쪽 흔들기', desc: '세터 근처로 넣어 토스를 방해합니다.', tip: '에이스는 적지만 상대 공격의 정확도를 떨어뜨려요.' },
      { id: 'deep_corner', name: '뒤쪽 모서리 공략', desc: '엔드라인 모서리로 깊게 찔러 넣습니다.', tip: '앞으로 나온 수비에 강하고, 깊은 수비에 약해요. 범실도 늘어요.' },
    ],
  },
  serveRisk: {
    title: '서브 강도',
    options: [
      { id: 'aggressive', name: '강서브', desc: '세게 때려 리시브를 무너뜨립니다.', tip: '에이스가 늘지만 범실도 늘어요.' },
      { id: 'normal', name: '기본 서브', desc: '정확도와 힘의 균형을 맞춥니다.', tip: '큰 약점이 없어요.' },
      { id: 'safety_floater', name: '무회전 서브', desc: '흔들리는 공으로 범실 없이 넣습니다.', tip: '에이스는 적지만 속공 토스를 방해해요.' },
    ],
  },
  attackStyle: {
    title: '공격 방식',
    options: [
      { id: 'quick_tempo', name: '속공', desc: '낮고 빠른 토스로 블로킹이 뜨기 전에 때립니다.', tip: '리드 블록에 강하고 커밋 블록에 약해요. 리시브가 흔들리면 범실이 나요.' },
      { id: 'ace_open', name: '에이스 오픈 공격', desc: '높은 토스를 가장 강한 공격수에게 올립니다.', tip: '커밋 블록에 강하고 번치 블록에 약해요.' },
      { id: 'back_row', name: '중위·후위 공격', desc: '전위를 미끼로 쓰고 뒤에서 뛰어들어 때립니다.', tip: '번치 블록에 강하고 리드 블록에 약해요.' },
      { id: 'delayed_time', name: '시간차와 페인트', desc: '타이밍을 뺏어 빈 곳에 살짝 떨어뜨립니다.', tip: '깊은 수비에 강하고 앞쪽 수비에 약해요.' },
    ],
  },
  blockSystem: {
    title: '블로킹',
    options: [
      { id: 'read_block', name: '리드 블록', desc: '토스 방향을 끝까지 보고 뜁니다.', tip: '중위·후위 공격에 강하고 속공에 약해요.' },
      { id: 'guess_commit', name: '커밋 블록', desc: '속공을 예상하고 먼저 뜁니다.', tip: '속공에 강하고 오픈 공격에 약해요.' },
      { id: 'bunch', name: '번치 블록', desc: '블로커가 가운데에 모였다가 함께 움직입니다.', tip: '오픈 공격에 강하고 중위·후위 공격에 약해요.' },
    ],
  },
  defenseFormation: {
    title: '수비 위치',
    options: [
      { id: 'net_cover', name: '앞쪽 수비', desc: '중위가 앞으로 나와 짧은 공을 받습니다.', tip: '페인트에 강하고 뒤쪽 서브에 약해요.' },
      { id: 'deep_dig', name: '깊은 수비', desc: '후위가 뒤로 물러나 강타를 받습니다.', tip: '강타와 뒤쪽 서브에 강하고 페인트에 약해요.' },
    ],
  },
};

export const DEFAULT_TACTICS = {
  serveTarget: 'weak_receiver',
  serveRisk: 'normal',
  attackStyle: 'ace_open',
  blockSystem: 'read_block',
  defenseFormation: 'deep_dig',
};

// 공격 방식 대 블로킹. 양수면 공격 쪽이 유리하다.
export const ATTACK_VS_BLOCK = {
  quick_tempo: { read_block: 1, guess_commit: -1, bunch: 0 },
  ace_open: { read_block: 0, guess_commit: 1, bunch: -1 },
  back_row: { read_block: -1, guess_commit: 0, bunch: 1 },
  delayed_time: { read_block: 0, guess_commit: 0, bunch: 0 },
};

// 공격 방식 대 수비 위치. 양수면 공격 쪽이 유리하다.
export const ATTACK_VS_DEFENSE = {
  quick_tempo: { net_cover: 0.3, deep_dig: -0.3 },
  ace_open: { net_cover: 0.3, deep_dig: -0.3 },
  back_row: { net_cover: 0.3, deep_dig: -0.3 },
  delayed_time: { net_cover: -0.45, deep_dig: 0.45 },
};

// 전술이 실제로 승부에 작용했을 때 경기 화면에 띄우는 문구
export const BLOCK_CALLOUTS = {
  'quick_tempo:read_block': '속공이 리드 블록보다 빨랐다!',
  'quick_tempo:guess_commit': '커밋 블록이 속공을 읽었다!',
  'ace_open:guess_commit': '오픈 공격이 먼저 뜬 커밋 블록을 넘겼다!',
  'ace_open:bunch': '번치 블록이 오픈 공격을 막아 세웠다!',
  'back_row:bunch': '번치 블록 뒤에서 중위·후위 공격이 터졌다!',
  'back_row:read_block': '리드 블록이 뒤쪽 공격까지 따라갔다!',
};

export const DEFENSE_CALLOUTS = {
  feintBeatsDeep: '페인트가 깊은 수비 앞에 떨어졌다!',
  coverStopsFeint: '앞쪽 수비가 페인트를 걷어 올렸다!',
  deepStopsPower: '깊은 수비가 강타를 받아 냈다!',
  powerBeatsCover: '강타가 앞쪽 수비 뒤로 꽂혔다!',
};

export const SERVE_CALLOUTS = {
  deepCorner: '뒤쪽 모서리 서브가 앞쪽 수비를 뚫었다!',
  weakReceiver: '약한 리시버를 노린 서브가 통했다!',
  floaterQuick: '무회전 서브가 속공 토스를 흔들었다!',
  setterLine: '세터를 노린 서브가 토스를 흔들었다!',
};

// 상대가 자주 쓰는 공격을 막기 좋은 전술
export const COUNTER_TIPS = {
  quick_tempo: '속공이 많으면 커밋 블록이 유리해요.',
  ace_open: '오픈 공격이 많으면 번치 블록이 유리해요.',
  back_row: '중위·후위 공격이 많으면 리드 블록이 유리해요.',
  delayed_time: '페인트가 많으면 앞쪽 수비가 유리해요.',
};

export const tacticName = (category, id) =>
  TACTIC_OPTIONS[category]?.options.find((o) => o.id === id)?.name ?? id;

export function sanitizeTactics(input, fallback = DEFAULT_TACTICS) {
  const out = {};
  for (const [category, def] of Object.entries(TACTIC_OPTIONS)) {
    const wanted = input?.[category];
    out[category] = def.options.some((o) => o.id === wanted) ? wanted : fallback[category];
  }
  return out;
}
