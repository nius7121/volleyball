import { calculateVolleyballStats } from './papsData';

export const DEFAULT_CHARACTERS = [
  // === Team 1: 카라스노 블랙 까마귀단 (Karasuno) ===
  {
    id: 'c1',
    name: '강일우 (히나타 오마주)',
    team: 'karasuno',
    number: 10,
    position: 'MB',
    gender: 'male',
    height: 164,
    catchphrase: '날아라! 가장 높은 곳으로!',
    appearance: {
      hairStyle: 'spiky',
      hairColor: '#FF6D00',
      skinTone: '#FCD34D',
      eyeType: 'fierce',
      accessory: 'kneePads'
    },
    paps: {
      shuttleRunGrade: 1,
      standingJumpGrade: 1,
      gripStrengthGrade: 3,
      sitAndReachGrade: 2,
      sitUpsGrade: 1
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 1, standingJumpGrade: 1, gripStrengthGrade: 3, sitAndReachGrade: 2, sitUpsGrade: 1 },
      164,
      'MB'
    )
  },
  {
    id: 'c2',
    name: '민시우 (카게야마 오마주)',
    team: 'karasuno',
    number: 9,
    position: 'S',
    gender: 'male',
    height: 181,
    catchphrase: '공은 반드시 내 손끝을 거친다.',
    appearance: {
      hairStyle: 'straight',
      hairColor: '#1E293B',
      skinTone: '#FEE2E2',
      eyeType: 'sharp',
      accessory: 'wristBand'
    },
    paps: {
      shuttleRunGrade: 1,
      standingJumpGrade: 2,
      gripStrengthGrade: 1,
      sitAndReachGrade: 2,
      sitUpsGrade: 1
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 1, standingJumpGrade: 2, gripStrengthGrade: 1, sitAndReachGrade: 2, sitUpsGrade: 1 },
      181,
      'S'
    )
  },
  {
    id: 'c3',
    name: '박진혁 (아사히 오마주)',
    team: 'karasuno',
    number: 3,
    position: 'WS',
    gender: 'male',
    height: 186,
    catchphrase: '어떤 블로킹이 와도 뚫어낸다!',
    appearance: {
      hairStyle: 'ponytail',
      hairColor: '#451A03',
      skinTone: '#FDE68A',
      eyeType: 'calm',
      accessory: 'kneePads'
    },
    paps: {
      shuttleRunGrade: 2,
      standingJumpGrade: 2,
      gripStrengthGrade: 1,
      sitAndReachGrade: 3,
      sitUpsGrade: 2
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 2, standingJumpGrade: 2, gripStrengthGrade: 1, sitAndReachGrade: 3, sitUpsGrade: 2 },
      186,
      'WS'
    )
  },
  {
    id: 'c4',
    name: '최태양 (타나카 오마주)',
    team: 'karasuno',
    number: 5,
    position: 'WS',
    gender: 'male',
    height: 178,
    catchphrase: '기백이다! 물러서지 마라!',
    appearance: {
      hairStyle: 'buzz',
      hairColor: '#262626',
      skinTone: '#FBBF24',
      eyeType: 'fierce',
      accessory: 'wristBand'
    },
    paps: {
      shuttleRunGrade: 1,
      standingJumpGrade: 2,
      gripStrengthGrade: 2,
      sitAndReachGrade: 3,
      sitUpsGrade: 1
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 1, standingJumpGrade: 2, gripStrengthGrade: 2, sitAndReachGrade: 3, sitUpsGrade: 1 },
      178,
      'WS'
    )
  },
  {
    id: 'c5',
    name: '윤도현 (츠키시마 오마주)',
    team: 'karasuno',
    number: 11,
    position: 'MB',
    gender: 'male',
    height: 191,
    catchphrase: '단지 1점일 뿐이잖아요. 냉정하게 셧아웃.',
    appearance: {
      hairStyle: 'shortCurly',
      hairColor: '#F59E0B',
      skinTone: '#FEF3C7',
      eyeType: 'glasses',
      accessory: 'glasses'
    },
    paps: {
      shuttleRunGrade: 3,
      standingJumpGrade: 2,
      gripStrengthGrade: 2,
      sitAndReachGrade: 3,
      sitUpsGrade: 3
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 3, standingJumpGrade: 2, gripStrengthGrade: 2, sitAndReachGrade: 3, sitUpsGrade: 3 },
      191,
      'MB'
    )
  },
  {
    id: 'c6',
    name: '송우진 (니시노야 오마주)',
    team: 'karasuno',
    number: 4,
    position: 'L',
    gender: 'male',
    height: 161,
    catchphrase: '등 뒤는 내가 지킨다! 이어라!',
    appearance: {
      hairStyle: 'pompadour',
      hairColor: '#171717',
      skinTone: '#FDE68A',
      eyeType: 'fierce',
      accessory: 'elbowPads'
    },
    paps: {
      shuttleRunGrade: 1,
      standingJumpGrade: 2,
      gripStrengthGrade: 3,
      sitAndReachGrade: 1,
      sitUpsGrade: 1
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 1, standingJumpGrade: 2, gripStrengthGrade: 3, sitAndReachGrade: 1, sitUpsGrade: 1 },
      161,
      'L'
    )
  },
  {
    id: 'c7',
    name: '한정훈 (야마구치 오마주 - 핀치서버)',
    team: 'karasuno',
    number: 12,
    position: 'MB',
    gender: 'male',
    height: 180,
    catchphrase: '무회전 점프 플로터로 흔든다!',
    appearance: {
      hairStyle: 'straight',
      hairColor: '#064E3B',
      skinTone: '#FEF3C7',
      eyeType: 'calm',
      accessory: 'kneePads'
    },
    paps: {
      shuttleRunGrade: 2,
      standingJumpGrade: 2,
      gripStrengthGrade: 1,
      sitAndReachGrade: 2,
      sitUpsGrade: 2
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 2, standingJumpGrade: 2, gripStrengthGrade: 1, sitAndReachGrade: 2, sitUpsGrade: 2 },
      180,
      'MB'
    )
  },
  {
    id: 'c15',
    name: '서강민 (스가와라 오마주)',
    team: 'karasuno',
    number: 2,
    position: 'S',
    gender: 'male',
    height: 175,
    catchphrase: '포기하지 않는 플레이, 전술의 다양성!',
    appearance: {
      hairStyle: 'shortCurly',
      hairColor: '#94A3B8',
      skinTone: '#FEF3C7',
      eyeType: 'calm',
      accessory: 'kneePads'
    },
    paps: {
      shuttleRunGrade: 2,
      standingJumpGrade: 2,
      gripStrengthGrade: 2,
      sitAndReachGrade: 2,
      sitUpsGrade: 2
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 2, standingJumpGrade: 2, gripStrengthGrade: 2, sitAndReachGrade: 2, sitUpsGrade: 2 },
      175,
      'S'
    )
  },
  {
    id: 'c16',
    name: '오준영 (엔노시타 오마주)',
    team: 'karasuno',
    number: 6,
    position: 'WS',
    gender: 'male',
    height: 176,
    catchphrase: '기본에 충실하게 코트를 받친다.',
    appearance: {
      hairStyle: 'straight',
      hairColor: '#334155',
      skinTone: '#FDE68A',
      eyeType: 'calm',
      accessory: 'kneePads'
    },
    paps: {
      shuttleRunGrade: 2,
      standingJumpGrade: 2,
      gripStrengthGrade: 2,
      sitAndReachGrade: 2,
      sitUpsGrade: 2
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 2, standingJumpGrade: 2, gripStrengthGrade: 2, sitAndReachGrade: 2, sitUpsGrade: 2 },
      176,
      'WS'
    )
  },
  {
    id: 'c17',
    name: '배규민 (나리타 오마주)',
    team: 'karasuno',
    number: 8,
    position: 'MB',
    gender: 'male',
    height: 181,
    catchphrase: '조용하지만 묵직한 C속공!',
    appearance: {
      hairStyle: 'buzz',
      hairColor: '#171717',
      skinTone: '#FBBF24',
      eyeType: 'calm',
      accessory: 'kneePads'
    },
    paps: {
      shuttleRunGrade: 2,
      standingJumpGrade: 2,
      gripStrengthGrade: 2,
      sitAndReachGrade: 3,
      sitUpsGrade: 2
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 2, standingJumpGrade: 2, gripStrengthGrade: 2, sitAndReachGrade: 3, sitUpsGrade: 2 },
      181,
      'MB'
    )
  },

  // === Team 2: 네코마 레드 삵고양이단 (Nekoma) ===
  {
    id: 'c8',
    name: '구재희 (쿠로오 오마주)',
    team: 'nekoma',
    number: 1,
    position: 'MB',
    gender: 'male',
    height: 188,
    catchphrase: '우리는 혈액이다. 막힘없이 흘러 산소를 돌아라.',
    appearance: {
      hairStyle: 'rooster',
      hairColor: '#171717',
      skinTone: '#FDE68A',
      eyeType: 'sharp',
      accessory: 'kneePads'
    },
    paps: {
      shuttleRunGrade: 1,
      standingJumpGrade: 2,
      gripStrengthGrade: 1,
      sitAndReachGrade: 1,
      sitUpsGrade: 1
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 1, standingJumpGrade: 2, gripStrengthGrade: 1, sitAndReachGrade: 1, sitUpsGrade: 1 },
      188,
      'MB'
    )
  },
  {
    id: 'c9',
    name: '신유현 (켄마 오마주)',
    team: 'nekoma',
    number: 5,
    position: 'S',
    gender: 'male',
    height: 170,
    catchphrase: '게임 오버를 보여줄게.',
    appearance: {
      hairStyle: 'pudding',
      hairColor: '#CA8A04',
      skinTone: '#FEF2F2',
      eyeType: 'cat',
      accessory: 'none'
    },
    paps: {
      shuttleRunGrade: 4,
      standingJumpGrade: 3,
      gripStrengthGrade: 3,
      sitAndReachGrade: 1,
      sitUpsGrade: 2
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 4, standingJumpGrade: 3, gripStrengthGrade: 3, sitAndReachGrade: 1, sitUpsGrade: 2 },
      170,
      'S'
    )
  },
  {
    id: 'c10',
    name: '장도완 (야쿠 오마주)',
    team: 'nekoma',
    number: 3,
    position: 'L',
    gender: 'male',
    height: 166,
    catchphrase: '내 구역에 떨어진 공은 없다.',
    appearance: {
      hairStyle: 'spikyShort',
      hairColor: '#9A3412',
      skinTone: '#FDE68A',
      eyeType: 'fierce',
      accessory: 'elbowPads'
    },
    paps: {
      shuttleRunGrade: 1,
      standingJumpGrade: 1,
      gripStrengthGrade: 2,
      sitAndReachGrade: 1,
      sitUpsGrade: 1
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 1, standingJumpGrade: 1, gripStrengthGrade: 2, sitAndReachGrade: 1, sitUpsGrade: 1 },
      166,
      'L'
    )
  },
  {
    id: 'c11',
    name: '임호성 (리에프 오마주)',
    team: 'nekoma',
    number: 11,
    position: 'MB',
    gender: 'male',
    height: 196,
    catchphrase: '높이에서 절대 지지 않는다!',
    appearance: {
      hairStyle: 'silverWolf',
      hairColor: '#94A3B8',
      skinTone: '#F8FAFC',
      eyeType: 'cat',
      accessory: 'kneePads'
    },
    paps: {
      shuttleRunGrade: 2,
      standingJumpGrade: 1,
      gripStrengthGrade: 2,
      sitAndReachGrade: 4,
      sitUpsGrade: 2
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 2, standingJumpGrade: 1, gripStrengthGrade: 2, sitAndReachGrade: 4, sitUpsGrade: 2 },
      196,
      'MB'
    )
  },
  {
    id: 'c12',
    name: '권동혁 (야마모토 오마주)',
    team: 'nekoma',
    number: 4,
    position: 'WS',
    gender: 'male',
    height: 177,
    catchphrase: '에이스의 긍지!',
    appearance: {
      hairStyle: 'mohawk',
      hairColor: '#78350F',
      skinTone: '#FBBF24',
      eyeType: 'fierce',
      accessory: 'wristBand'
    },
    paps: {
      shuttleRunGrade: 1,
      standingJumpGrade: 2,
      gripStrengthGrade: 1,
      sitAndReachGrade: 2,
      sitUpsGrade: 1
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 1, standingJumpGrade: 2, gripStrengthGrade: 1, sitAndReachGrade: 2, sitUpsGrade: 1 },
      177,
      'WS'
    )
  },
  {
    id: 'c13',
    name: '서민준 (후쿠나가 오마주)',
    team: 'nekoma',
    number: 6,
    position: 'WS',
    gender: 'male',
    height: 179,
    catchphrase: '침묵의 코스 스파이크.',
    appearance: {
      hairStyle: 'straight',
      hairColor: '#334155',
      skinTone: '#FEF3C7',
      eyeType: 'calm',
      accessory: 'none'
    },
    paps: {
      shuttleRunGrade: 2,
      standingJumpGrade: 2,
      gripStrengthGrade: 2,
      sitAndReachGrade: 2,
      sitUpsGrade: 2
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 2, standingJumpGrade: 2, gripStrengthGrade: 2, sitAndReachGrade: 2, sitUpsGrade: 2 },
      179,
      'WS'
    )
  },
  {
    id: 'c14',
    name: '배승우 (네코마 핀치서버/블로커)',
    team: 'nekoma',
    number: 7,
    position: 'OP',
    gender: 'male',
    height: 183,
    catchphrase: '원포인트로 상대 템포를 빼앗는다.',
    appearance: {
      hairStyle: 'shortCurly',
      hairColor: '#1E293B',
      skinTone: '#FDE68A',
      eyeType: 'sharp',
      accessory: 'wristBand'
    },
    paps: {
      shuttleRunGrade: 2,
      standingJumpGrade: 2,
      gripStrengthGrade: 1,
      sitAndReachGrade: 3,
      sitUpsGrade: 2
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 2, standingJumpGrade: 2, gripStrengthGrade: 1, sitAndReachGrade: 3, sitUpsGrade: 2 },
      183,
      'OP'
    )
  },
  {
    id: 'c18',
    name: '조은성 (카이 오마주)',
    team: 'nekoma',
    number: 2,
    position: 'WS',
    gender: 'male',
    height: 177,
    catchphrase: '팀을 안정시키는 든든한 리시브.',
    appearance: {
      hairStyle: 'buzz',
      hairColor: '#171717',
      skinTone: '#FDE68A',
      eyeType: 'calm',
      accessory: 'kneePads'
    },
    paps: {
      shuttleRunGrade: 2,
      standingJumpGrade: 2,
      gripStrengthGrade: 2,
      sitAndReachGrade: 1,
      sitUpsGrade: 2
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 2, standingJumpGrade: 2, gripStrengthGrade: 2, sitAndReachGrade: 1, sitUpsGrade: 2 },
      177,
      'WS'
    )
  },
  {
    id: 'c19',
    name: '유하늘 (시바야마 오마주)',
    team: 'nekoma',
    number: 12,
    position: 'L',
    gender: 'male',
    height: 162,
    catchphrase: '블로커의 길을 믿고 디그를 건진다!',
    appearance: {
      hairStyle: 'spikyShort',
      hairColor: '#475569',
      skinTone: '#FEF3C7',
      eyeType: 'fierce',
      accessory: 'elbowPads'
    },
    paps: {
      shuttleRunGrade: 1,
      standingJumpGrade: 2,
      gripStrengthGrade: 3,
      sitAndReachGrade: 1,
      sitUpsGrade: 2
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 1, standingJumpGrade: 2, gripStrengthGrade: 3, sitAndReachGrade: 1, sitUpsGrade: 2 },
      162,
      'L'
    )
  },
  {
    id: 'c20',
    name: '황선우 (테시로 오마주)',
    team: 'nekoma',
    number: 9,
    position: 'S',
    gender: 'male',
    height: 173,
    catchphrase: '정확한 핀치 세트로 승기를 잡는다.',
    appearance: {
      hairStyle: 'straight',
      hairColor: '#18181B',
      skinTone: '#FEF3C7',
      eyeType: 'calm',
      accessory: 'wristBand'
    },
    paps: {
      shuttleRunGrade: 2,
      standingJumpGrade: 3,
      gripStrengthGrade: 2,
      sitAndReachGrade: 2,
      sitUpsGrade: 2
    },
    stats: calculateVolleyballStats(
      { shuttleRunGrade: 2, standingJumpGrade: 3, gripStrengthGrade: 2, sitAndReachGrade: 2, sitUpsGrade: 2 },
      173,
      'S'
    )
  }
];

export const INITIAL_TEAMS = {
  teamA: {
    id: 'teamA',
    name: '카라스노 하이스쿨 (Karasuno)',
    motto: '날아라 (飛べ)',
    theme: 'orange',
    primaryColor: '#FF5722',
    secondaryColor: '#111215',
    substitutionsRemaining: 6,
    timeoutsRemaining: 2,
    starterIds6: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'],
    starterIds9: ['c3', 'c1', 'c4', 'c2', 'c5', 'c15', 'c6', 'c16', 'c7'],
    starterIds: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'],
    liberoId: 'c6',
    benchIds: ['c7', 'c15', 'c16', 'c17'],
    tactics: {
      serveTarget: 'libero_avoid',
      serveRisk: 'normal',
      attackStyle: 'quick_tempo',
      blockSystem: 'read_block',
      defenseFormation: 'libero_hub'
    }
  },
  teamB: {
    id: 'teamB',
    name: '네코마 하이스쿨 (Nekoma)',
    motto: '이어라 (繋게)',
    theme: 'red',
    primaryColor: '#DC2626',
    secondaryColor: '#171717',
    substitutionsRemaining: 6,
    timeoutsRemaining: 2,
    starterIds6: ['c8', 'c9', 'c10', 'c11', 'c12', 'c13'],
    starterIds9: ['c12', 'c8', 'c11', 'c9', 'c13', 'c14', 'c10', 'c18', 'c19'],
    starterIds: ['c8', 'c9', 'c10', 'c11', 'c12', 'c13'],
    liberoId: 'c10',
    benchIds: ['c14', 'c18', 'c19', 'c20'],
    tactics: {
      serveTarget: 'weak_passer',
      serveRisk: 'normal',
      attackStyle: 'combination',
      blockSystem: 'read_block',
      defenseFormation: 'libero_hub'
    }
  }
};
