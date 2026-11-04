// 인원이 모자랄 때 선생님이 확인 후 채우는 기본 선수. 실제 학생과 헷갈리지 않게 NPC로 표시한다.

const LOOKS = [
  { look: 'boy', hairStyle: 'spiky', hairColor: '#7C2D12', skinTone: '#FDE68A', eyeType: 'fierce' },
  { look: 'girl', hairStyle: 'bob', hairColor: '#18181B', skinTone: '#FEF3C7', eyeType: 'calm' },
  { look: 'boy', hairStyle: 'buzz', hairColor: '#451A03', skinTone: '#F5C77E', eyeType: 'sharp' },
  { look: 'girl', hairStyle: 'highPonytail', hairColor: '#451A03', skinTone: '#FDE68A', eyeType: 'fierce' },
  { look: 'boy', hairStyle: 'shortCurly', hairColor: '#18181B', skinTone: '#FDE68A', eyeType: 'glasses' },
  { look: 'girl', hairStyle: 'shortCut', hairColor: '#18181B', skinTone: '#F5C77E', eyeType: 'cat' },
];

const ROLE_CYCLE = ['WS', 'DS', 'MB', 'DS', 'S', 'DS', 'WS', 'DS', 'WS'];

export function createNpc(index) {
  const look = LOOKS[index % LOOKS.length];
  const hope = ROLE_CYCLE[index % ROLE_CYCLE.length];
  return {
    id: `npc_${index + 1}`,
    isNpc: true,
    name: `NPC ${index + 1}`,
    number: 50 + index,
    gender: look.look === 'girl' ? 'female' : 'male',
    height: 165,
    hopePosition: hope,
    catchphrase: '빈자리는 내가 채운다!',
    appearance: { ...look },
    paps: { shuttleRunGrade: 3, standingJumpGrade: 3, gripStrengthGrade: 3, sitAndReachGrade: 3, sitUpsGrade: 3 },
  };
}
