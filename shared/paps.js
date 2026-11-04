// 대한민국 교육부 중학교 PAPS(학생건강체력평가제) 기준 데이터 및 배구 능력치 변환기

export const PAPS_BENCHMARK = {
  male: {
    shuttleRun: [
      { grade: 1, min: 77, label: '1등급 (77회 이상)' },
      { grade: 2, min: 60, label: '2등급 (60~76회)' },
      { grade: 3, min: 43, label: '3등급 (43~59회)' },
      { grade: 4, min: 26, label: '4등급 (26~42회)' },
      { grade: 5, min: 0,  label: '5등급 (25회 이하)' }
    ],
    standingJump: [
      { grade: 1, min: 230, label: '1등급 (230cm 이상)' },
      { grade: 2, min: 208, label: '2등급 (208~229cm)' },
      { grade: 3, min: 185, label: '3등급 (185~207cm)' },
      { grade: 4, min: 162, label: '4등급 (162~184cm)' },
      { grade: 5, min: 0,   label: '5등급 (161cm 이하)' }
    ],
    gripStrength: [
      { grade: 1, min: 41, label: '1등급 (41kg 이상)' },
      { grade: 2, min: 35, label: '2등급 (35~40kg)' },
      { grade: 3, min: 29, label: '3등급 (29~34kg)' },
      { grade: 4, min: 23, label: '4등급 (23~28kg)' },
      { grade: 5, min: 0,  label: '5등급 (22kg 이하)' }
    ],
    sitAndReach: [
      { grade: 1, min: 17, label: '1등급 (17cm 이상)' },
      { grade: 2, min: 10, label: '2등급 (10~16cm)' },
      { grade: 3, min: 3,  label: '3등급 (3~9cm)' },
      { grade: 4, min: -4, label: '4등급 (-4~2cm)' },
      { grade: 5, min: -99,label: '5등급 (-5cm 이하)' }
    ],
    sitUps: [
      { grade: 1, min: 60, label: '1등급 (60회 이상)' },
      { grade: 2, min: 50, label: '2등급 (50~59회)' },
      { grade: 3, min: 40, label: '3등급 (40~49회)' },
      { grade: 4, min: 30, label: '4등급 (30~39회)' },
      { grade: 5, min: 0,  label: '5등급 (29회 이하)' }
    ]
  },
  female: {
    shuttleRun: [
      { grade: 1, min: 51, label: '1등급 (51회 이상)' },
      { grade: 2, min: 39, label: '2등급 (39~50회)' },
      { grade: 3, min: 28, label: '3등급 (28~38회)' },
      { grade: 4, min: 17, label: '4등급 (17~27회)' },
      { grade: 5, min: 0,  label: '5등급 (16회 이하)' }
    ],
    standingJump: [
      { grade: 1, min: 180, label: '1등급 (180cm 이상)' },
      { grade: 2, min: 161, label: '2등급 (161~179cm)' },
      { grade: 3, min: 142, label: '3등급 (142~160cm)' },
      { grade: 4, min: 123, label: '4등급 (123~141cm)' },
      { grade: 5, min: 0,   label: '5등급 (122cm 이하)' }
    ],
    gripStrength: [
      { grade: 1, min: 28, label: '1등급 (28kg 이상)' },
      { grade: 2, min: 24, label: '2등급 (24~27kg)' },
      { grade: 3, min: 20, label: '3등급 (20~23kg)' },
      { grade: 4, min: 16, label: '4등급 (16~19kg)' },
      { grade: 5, min: 0,  label: '5등급 (15kg 이하)' }
    ],
    sitAndReach: [
      { grade: 1, min: 21, label: '1등급 (21cm 이상)' },
      { grade: 2, min: 15, label: '2등급 (15~20cm)' },
      { grade: 3, min: 9,  label: '3등급 (9~14cm)' },
      { grade: 4, min: 3,  label: '4등급 (3~8cm)' },
      { grade: 5, min: -99,label: '5등급 (2cm 이하)' }
    ],
    sitUps: [
      { grade: 1, min: 46, label: '1등급 (46회 이상)' },
      { grade: 2, min: 37, label: '2등급 (37~45회)' },
      { grade: 3, min: 28, label: '3등급 (28~36회)' },
      { grade: 4, min: 19, label: '4등급 (19~27회)' },
      { grade: 5, min: 0,  label: '5등급 (18회 이하)' }
    ]
  }
};

// 등급 점수화 (1등급: 96점, 2등급: 84점, 3등급: 72점, 4등급: 60점, 5등급: 48점)
export const gradeToScore = (grade) => {
  switch (grade) {
    case 1: return 96;
    case 2: return 84;
    case 3: return 72;
    case 4: return 60;
    default: return 48;
  }
};

// 키(cm) 점수화 (중학생 기준 155cm ~ 190cm)
export const heightToScore = (heightCm) => {
  const clamped = Math.max(150, Math.min(195, heightCm));
  return Math.round(50 + ((clamped - 150) / 45) * 48); // 50 ~ 98
};

/**
 * PAPS 측정값 또는 등급을 배구 6대 스탯으로 환산
 */
export const calculateVolleyballStats = (paps, height = 175, position = 'WS') => {
  // paps: { shuttleRunGrade, standingJumpGrade, gripStrengthGrade, sitAndReachGrade, sitUpsGrade } (1~5)
  const shuttleScore = gradeToScore(paps.shuttleRunGrade || 3);
  const jumpScore = gradeToScore(paps.standingJumpGrade || 3);
  const gripScore = gradeToScore(paps.gripStrengthGrade || 3);
  const reachScore = gradeToScore(paps.sitAndReachGrade || 3);
  const sitUpScore = gradeToScore(paps.sitUpsGrade || 3);
  const hScore = heightToScore(height);

  // 1. 스파이크 파워 (Spike): 제자리멀리뛰기(점프 탄력) + 악력(손목 스냅 및 타격력) + 키
  let spike = Math.round(jumpScore * 0.35 + gripScore * 0.40 + hScore * 0.25);

  // 2. 블로킹 (Block): 키(타점) + 제자리멀리뛰기 + 윗몸일으키기(코어 밸런스)
  let block = Math.round(hScore * 0.50 + jumpScore * 0.35 + sitUpScore * 0.15);

  // 3. 서브 위력 (Serve): 악력(스파이크/무회전 타격) + 윗몸일으키기(상체 회전) + 셔틀런
  let serve = Math.round(gripScore * 0.45 + sitUpScore * 0.35 + jumpScore * 0.20);

  // 4. 수비/리시브/디그 (Receive): 유연성(좌전굴) + 셔틀런(풋워크) + 순발력
  let receive = Math.round(reachScore * 0.45 + shuttleScore * 0.35 + jumpScore * 0.20);

  // 5. 토스/정밀도 (Toss): 유연성 + 윗몸(안정된 중심) + 악력(손끝 컨트롤)
  let toss = Math.round(reachScore * 0.35 + sitUpScore * 0.40 + gripScore * 0.25);

  // 6. 스피드 & 스태미너 (Speed/Stamina): 셔틀런 + 제자리멀리뛰기 + 윗몸일으키기
  let speed = Math.round(shuttleScore * 0.50 + jumpScore * 0.30 + sitUpScore * 0.20);

  // 포지션별 고유 적성 보너스 (각 포지션 주력 스탯 +4~+6 부스트)
  if (position === 'S') {
    toss = Math.min(99, toss + 8);
    speed = Math.min(99, speed + 3);
  } else if (position === 'MB') {
    block = Math.min(99, block + 7);
    spike = Math.min(99, spike + 3);
  } else if (position === 'DS') {
    receive = Math.min(99, receive + 8);
    speed = Math.min(99, speed + 3);
  } else if (position === 'WS') {
    spike = Math.min(99, spike + 6);
    receive = Math.min(99, receive + 2);
  }

  // 종합 능력치 (OVR)
  const ovr = Math.round((spike + block + serve + receive + toss + speed) / 6);

  return {
    spike,
    block,
    serve,
    receive,
    toss,
    speed,
    ovr
  };
};

export const PAPS_ITEMS = [
  { key: 'shuttleRun', gradeKey: 'shuttleRunGrade', name: '왕복오래달리기', unit: '회', helps: '체력, 수비 범위' },
  { key: 'standingJump', gradeKey: 'standingJumpGrade', name: '제자리멀리뛰기', unit: 'cm', helps: '스파이크, 블로킹' },
  { key: 'gripStrength', gradeKey: 'gripStrengthGrade', name: '악력', unit: 'kg', helps: '스파이크, 서브' },
  { key: 'sitAndReach', gradeKey: 'sitAndReachGrade', name: '앉아윗몸앞으로굽히기', unit: 'cm', helps: '리시브, 토스' },
  { key: 'sitUps', gradeKey: 'sitUpsGrade', name: '윗몸일으키기', unit: '회', helps: '서브, 토스' },
];

// 측정값을 등급으로만 바꾼다. 측정값 자체는 서버로 보내지 않는다.
export const gradeFromMeasure = (gender, itemKey, value) => {
  const table = PAPS_BENCHMARK[gender]?.[itemKey];
  const row = table?.find((item) => value >= item.min);
  return row ? row.grade : 5;
};

export const STAT_LABELS = {
  spike: '스파이크',
  block: '블로킹',
  serve: '서브',
  receive: '리시브',
  toss: '토스',
  speed: '체력',
};

