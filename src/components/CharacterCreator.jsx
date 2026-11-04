import React, { useState } from 'react';
import CharacterAvatar from './CharacterAvatar';
import { calculateVolleyballStats, PAPS_BENCHMARK, getTier } from '../data/papsData';
import { Sparkles, Save, User, Shield, Zap, Activity, Wind, Heart, Award } from './Icons';

const HAIR_STYLES = [
  { id: 'spiky', name: '히나타 풍 삐죽머리' },
  { id: 'straight', name: '카게야마 풍 스트레이트' },
  { id: 'rooster', name: '쿠로오 풍 비대칭 닭벼슬' },
  { id: 'pudding', name: '켄마 풍 투톤 푸딩' },
  { id: 'pompadour', name: '보쿠토/니시노야 풍 솟은 머리' },
  { id: 'shortCurly', name: '츠키시마 풍 숏 펌' },
  { id: 'buzz', name: '타나카 풍 기백 반삭' },
  { id: 'ponytail', name: '아사히 풍 꽁지머리' }
];

const HAIR_COLORS = [
  { color: '#FF6D00', name: '불꽃 오렌지' },
  { color: '#18181B', name: '카라스노 칠흑' },
  { color: '#451A03', name: '다크 브라운' },
  { color: '#EAB308', name: '골든 옐로우' },
  { color: '#94A3B8', name: '애쉬 실버' },
  { color: '#064E3B', name: '포레스트 그린' },
  { color: '#DC2626', name: '크림슨 레드' }
];

const EYE_TYPES = [
  { id: 'fierce', name: '열혈 투지 눈매' },
  { id: 'sharp', name: '에이스의 날카로운 눈매' },
  { id: 'calm', name: '냉철하고 침착한 눈매' },
  { id: 'cat', name: '켄마 풍 쿨한 고양이 눈매' },
  { id: 'glasses', name: '츠키시마 풍 스포츠 고글/안경' }
];

const SKIN_TONES = [
  { color: '#FEF3C7', name: '밝은 피부' },
  { color: '#FDE68A', name: '자연스러운 혈색' },
  { color: '#FCD34D', name: '활기찬 건강미' },
  { color: '#F59E0B', name: '태닝 구릿빛' }
];

export default function CharacterCreator({ onSaveCharacter, editingCharacter = null, onCancel }) {
  const [name, setName] = useState(editingCharacter ? editingCharacter.name : '새로운 루키');
  const [number, setNumber] = useState(editingCharacter ? editingCharacter.number : 7);
  const [position, setPosition] = useState(editingCharacter ? editingCharacter.position : 'WS');
  const [height, setHeight] = useState(editingCharacter ? editingCharacter.height : 176);
  const [gender, setGender] = useState(editingCharacter ? editingCharacter.gender : 'male');
  const [catchphrase, setCatchphrase] = useState(
    editingCharacter ? editingCharacter.catchphrase : '포기하지 않고 끝까지 공을 쫓는다!'
  );

  // 외형
  const [appearance, setAppearance] = useState(
    editingCharacter?.appearance || {
      hairStyle: 'spiky',
      hairColor: '#FF6D00',
      skinTone: '#FCD34D',
      eyeType: 'fierce',
      accessory: 'kneePads'
    }
  );

  // PAPS 5대 종목 등급 (1~5등급)
  const [paps, setPaps] = useState(
    editingCharacter?.paps || {
      shuttleRunGrade: 2,
      standingJumpGrade: 2,
      gripStrengthGrade: 2,
      sitAndReachGrade: 2,
      sitUpsGrade: 2
    }
  );

  // 측정치 정밀 모드 활성화 여부
  const [usePreciseValues, setUsePreciseValues] = useState(false);
  const [preciseValues, setPreciseValues] = useState({
    shuttleRun: 65,
    standingJump: 215,
    gripStrength: 36,
    sitAndReach: 12,
    sitUps: 52
  });

  // 실시간 배구 스탯 계산
  const stats = calculateVolleyballStats(paps, height, position);
  const tier = getTier(stats.ovr);

  const handlePapsGradeChange = (itemKey, grade) => {
    setPaps(prev => ({
      ...prev,
      [itemKey]: grade
    }));
  };

  const handlePreciseChange = (key, value, gradeKey) => {
    const val = Number(value);
    setPreciseValues(prev => ({ ...prev, [key]: val }));

    // 수치에 따라 자동으로 PAPS 등급 계산
    const benchmark = PAPS_BENCHMARK[gender][key];
    if (benchmark) {
      let matchedGrade = 5;
      for (const item of benchmark) {
        if (val >= item.min) {
          matchedGrade = item.grade;
          break;
        }
      }
      setPaps(prev => ({ ...prev, [gradeKey]: matchedGrade }));
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('선수 이름을 입력해주세요!');
      return;
    }

    const newChar = {
      id: editingCharacter ? editingCharacter.id : `custom_${Date.now()}`,
      name,
      number: Number(number),
      position,
      height: Number(height),
      gender,
      catchphrase,
      appearance,
      paps,
      stats,
      isCustom: true
    };

    onSaveCharacter(newChar);
  };

  return (
    <div className="bg-[#12141a] border-2 border-haikyu-orange rounded-2xl p-6 shadow-haikyu-lg max-w-5xl mx-auto">
      {/* 헤더 배너: 하이큐 만화 컷신 스타일 */}
      <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b-2 border-dashed border-[#2f3545]">
        <div>
          <span className="text-xs uppercase font-black bg-haikyu-orange text-black px-2 py-0.5 rounded tracking-wider mr-2">
            PAPS x HAIKYU ATHLETE CREATOR
          </span>
          <h2 className="text-2xl sm:text-3xl font-black haikyu-title text-white tracking-wide mt-1">
            {editingCharacter ? '선수 프로필 & 체력 데이터 수정' : '중학생 배구 선수 캐릭터 등록'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            중학교 PAPS(학생건강체력평가) 체력 측정치를 입력하면 실제 배구 경기 스탯으로 변환됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-lg text-sm border border-gray-700"
            >
              취소
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-haikyu-orange hover:bg-haikyu-orangeDark text-white font-black rounded-lg text-sm shadow-haikyu transition-all hover:scale-105 active:scale-95"
          >
            <Save className="w-4 h-4" /> 선수 등록 완료!
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 왼쪽 4칸: 실시간 하이큐 캐릭터 프리뷰 & 스탯 레이더 카드 */}
        <div className="lg:col-span-4 bg-[#181a22] border border-[#2b303f] rounded-xl p-5 flex flex-col items-center">
          <div className="text-xs font-bold text-gray-400 mb-2">실시간 선수 카드 미리보기</div>

          <div className="relative my-2">
            <CharacterAvatar
              appearance={appearance}
              number={number}
              teamColor="#FF5722"
              secondaryColor="#111215"
              size={140}
            />
          </div>

          <div className="w-full text-center mt-2">
            <span className="inline-block px-3 py-1 bg-haikyu-orange text-black font-black text-xs rounded-full shadow-sm mb-1">
              {position} (No.{number})
            </span>
            <h3 className="text-xl font-black haikyu-title text-white">{name || '선수명'}</h3>
            <p className="text-xs text-amber-400 font-bold">신장 {height}cm | {gender === 'male' ? '남학생' : '여학생'}</p>
            <p className="text-xs text-gray-300 italic mt-1 bg-[#101216] py-1.5 px-3 rounded border border-gray-800">
              "{catchphrase || '최선을 다한다'}"
            </p>
          </div>

          {/* 종합 오버롤 등급 표시 */}
          <div className={`w-full mt-4 p-3 rounded-xl border text-center ${tier.color}`}>
            <div className="text-[11px] font-bold text-gray-300">종합 배구 전투력 (OVR)</div>
            <div className="text-3xl font-black font-mono tracking-tight my-0.5">{stats.ovr}</div>
            <div className="text-xs font-black">{tier.label}</div>
          </div>

          {/* 배구 6대 스탯 게이지 */}
          <div className="w-full mt-4 space-y-2 text-xs">
            <div>
              <div className="flex justify-between font-bold mb-0.5">
                <span className="flex items-center gap-1 text-gray-300">
                  <Zap className="w-3.5 h-3.5 text-haikyu-orange" /> 스파이크 (Spike)
                </span>
                <span className="text-haikyu-orange font-mono font-black">{stats.spike}</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-haikyu-orange h-full" style={{ width: `${stats.spike}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-0.5">
                <span className="flex items-center gap-1 text-gray-300">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> 블로킹 (Block)
                </span>
                <span className="text-emerald-400 font-mono font-black">{stats.block}</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full" style={{ width: `${stats.block}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-0.5">
                <span className="flex items-center gap-1 text-gray-300">
                  <Activity className="w-3.5 h-3.5 text-rose-400" /> 서브 위력 (Serve)
                </span>
                <span className="text-rose-400 font-mono font-black">{stats.serve}</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-400 h-full" style={{ width: `${stats.serve}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-0.5">
                <span className="flex items-center gap-1 text-gray-300">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" /> 리시브/디그 (Receive)
                </span>
                <span className="text-cyan-400 font-mono font-black">{stats.receive}</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full" style={{ width: `${stats.receive}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-0.5">
                <span className="flex items-center gap-1 text-gray-300">
                  <Award className="w-3.5 h-3.5 text-indigo-400" /> 토스 정밀도 (Toss)
                </span>
                <span className="text-indigo-400 font-mono font-black">{stats.toss}</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-400 h-full" style={{ width: `${stats.toss}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-0.5">
                <span className="flex items-center gap-1 text-gray-300">
                  <Heart className="w-3.5 h-3.5 text-amber-400" /> 스태미너/속도 (Stamina)
                </span>
                <span className="text-amber-400 font-mono font-black">{stats.speed}</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full" style={{ width: `${stats.speed}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽 8칸: 기본 정보, 외형 커스터마이징, 중학교 PAPS 입력 */}
        <div className="lg:col-span-8 space-y-5">
          {/* 1. 기본 프로필 설정 */}
          <div className="bg-[#181a22] border border-[#2b303f] rounded-xl p-4">
            <h4 className="text-sm font-black text-haikyu-orange uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> 1. 기본 인적사항 & 배구 포지션
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">선수 이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0e1014] border border-gray-700 rounded-lg px-3 py-2 text-white font-bold focus:border-haikyu-orange outline-none"
                  placeholder="예: 홍길동"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">등번호 (1~99)</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full bg-[#0e1014] border border-gray-700 rounded-lg px-3 py-2 text-white font-bold focus:border-haikyu-orange outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">신장 (키 cm)</label>
                <input
                  type="number"
                  min="150"
                  max="205"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full bg-[#0e1014] border border-gray-700 rounded-lg px-3 py-2 text-white font-bold focus:border-haikyu-orange outline-none"
                />
              </div>
            </div>

            {/* 포지션 선택 버튼들 */}
            <div className="mt-3">
              <label className="block text-gray-400 font-bold mb-1.5 text-xs">배구 포지션</label>
              <div className="grid grid-cols-5 gap-2 text-xs">
                {[
                  { id: 'WS', name: 'WS (윙 스파이커)', desc: '공격/리시브 주축' },
                  { id: 'MB', name: 'MB (미들 블로커)', desc: '속공 & 중앙 블로킹' },
                  { id: 'S', name: 'S (세터)', desc: '사령탑 토스 배분' },
                  { id: 'OP', name: 'OP (아포짓/라이트)', desc: '백어택 전문 주포' },
                  { id: 'L', name: 'L (리베로)', desc: '전문 수비 & 디그' }
                ].map(pos => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setPosition(pos.id)}
                    className={`py-2 px-1 rounded-lg text-center font-bold border transition ${
                      position === pos.id
                        ? 'bg-haikyu-orange text-black border-haikyu-orange shadow-sm font-black'
                        : 'bg-[#101216] text-gray-300 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-xs font-black">{pos.id}</div>
                    <div className="text-[10px] opacity-80 truncate">{pos.name.split(' ')[1]}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-gray-400 font-bold mb-1 text-xs">선수 각오 / 슬로건</label>
              <input
                type="text"
                value={catchphrase}
                onChange={(e) => setCatchphrase(e.target.value)}
                className="w-full bg-[#0e1014] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-haikyu-orange outline-none"
                placeholder="예: 공이 바닥에 떨어질 때까지 경기는 끝나지 않는다!"
              />
            </div>
          </div>

          {/* 2. 하이큐 스타일 외형 커스터마이징 */}
          <div className="bg-[#181a22] border border-[#2b303f] rounded-xl p-4">
            <h4 className="text-sm font-black text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> 2. 캐릭터 외형 커스터마이징 (하이큐 스타일)
            </h4>

            {/* 헤어스타일 선택 */}
            <div className="mb-3">
              <label className="block text-gray-400 font-bold mb-1.5 text-xs">헤어 스타일</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {HAIR_STYLES.map(style => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setAppearance(prev => ({ ...prev, hairStyle: style.id }))}
                    className={`p-1.5 rounded-lg text-left text-xs border font-medium transition ${
                      appearance.hairStyle === style.id
                        ? 'bg-amber-500 text-black border-amber-400 font-black'
                        : 'bg-[#101216] text-gray-300 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 헤어 컬러 & 눈매 & 피부톤 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1.5">헤어 컬러</label>
                <div className="flex flex-wrap gap-2">
                  {HAIR_COLORS.map(c => (
                    <button
                      key={c.color}
                      type="button"
                      title={c.name}
                      onClick={() => setAppearance(prev => ({ ...prev, hairColor: c.color }))}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        appearance.hairColor === c.color ? 'border-white scale-110 shadow-sm' : 'border-black'
                      }`}
                      style={{ backgroundColor: c.color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1.5">눈매 및 표정</label>
                <select
                  value={appearance.eyeType}
                  onChange={(e) => setAppearance(prev => ({ ...prev, eyeType: e.target.value }))}
                  className="w-full bg-[#0e1014] border border-gray-700 rounded-lg px-2 py-1.5 text-white font-bold outline-none"
                >
                  {EYE_TYPES.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1.5">피부 톤</label>
                <div className="flex gap-2">
                  {SKIN_TONES.map(s => (
                    <button
                      key={s.color}
                      type="button"
                      title={s.name}
                      onClick={() => setAppearance(prev => ({ ...prev, skinTone: s.color }))}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        appearance.skinTone === s.color ? 'border-white scale-110' : 'border-black'
                      }`}
                      style={{ backgroundColor: s.color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. 중학교 PAPS (학생건강체력평가) 기준표 및 측정치 입력 */}
          <div className="bg-[#181a22] border-2 border-emerald-600/70 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between mb-3 pb-2 border-b border-gray-800">
              <div>
                <h4 className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4" /> 3. 중학교 PAPS(학생건강체력평가) 기준 데이터
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  1~5등급을 선택하거나 정밀 측정치를 입력하면 배구 스탯에 즉시 반영됩니다.
                </p>
              </div>

              <div className="flex items-center gap-2 mt-2 sm:mt-0 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setUsePreciseValues(!usePreciseValues)}
                  className={`px-3 py-1 rounded-lg border text-xs font-black transition ${
                    usePreciseValues
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-gray-800 text-gray-300 border-gray-700'
                  }`}
                >
                  {usePreciseValues ? '정밀 측정치 입력 모드' : '간편 등급(1~5등급) 모드'}
                </button>
              </div>
            </div>

            {/* PAPS 5대 종목 설정 */}
            <div className="space-y-4">
              {/* 1. 셔틀런 (왕복오래달리기) */}
              <div className="bg-[#101217] p-3 rounded-lg border border-gray-800">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-black text-gray-200">
                    ① 왕복오래달리기 / 셔틀런 (심폐지구력)
                  </span>
                  <span className="text-amber-400 font-bold">
                    → 배구 스태미너 & 롱 랠리 집중력
                  </span>
                </div>

                {!usePreciseValues ? (
                  <div className="grid grid-cols-5 gap-1.5 mt-2">
                    {[1, 2, 3, 4, 5].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handlePapsGradeChange('shuttleRunGrade', g)}
                        className={`py-1.5 px-1 rounded text-center text-xs font-black border transition ${
                          paps.shuttleRunGrade === g
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-gray-800/80 text-gray-300 border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        {g}등급
                        <div className="text-[10px] opacity-70 font-normal">
                          {g === 1 ? '77회↑' : g === 2 ? '60~76' : g === 3 ? '43~59' : g === 4 ? '26~42' : '25회↓'}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min="15"
                      max="100"
                      value={preciseValues.shuttleRun}
                      onChange={(e) => handlePreciseChange('shuttleRun', e.target.value, 'shuttleRunGrade')}
                      className="flex-1 accent-amber-500"
                    />
                    <span className="font-mono font-black text-amber-400 text-sm w-16 text-right">
                      {preciseValues.shuttleRun}회 ({paps.shuttleRunGrade}등급)
                    </span>
                  </div>
                )}
              </div>

              {/* 2. 제자리멀리뛰기 */}
              <div className="bg-[#101217] p-3 rounded-lg border border-gray-800">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-black text-gray-200">
                    ② 제자리멀리뛰기 (순발력 / 점프 탄력)
                  </span>
                  <span className="text-cyan-400 font-bold">
                    → 스파이크 점프 높이 & 서브 도약
                  </span>
                </div>

                {!usePreciseValues ? (
                  <div className="grid grid-cols-5 gap-1.5 mt-2">
                    {[1, 2, 3, 4, 5].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handlePapsGradeChange('standingJumpGrade', g)}
                        className={`py-1.5 px-1 rounded text-center text-xs font-black border transition ${
                          paps.standingJumpGrade === g
                            ? 'bg-cyan-500 text-black border-cyan-400'
                            : 'bg-gray-800/80 text-gray-300 border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        {g}등급
                        <div className="text-[10px] opacity-70 font-normal">
                          {g === 1 ? '230cm↑' : g === 2 ? '208~229' : g === 3 ? '185~207' : g === 4 ? '162~184' : '161↓'}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min="120"
                      max="270"
                      value={preciseValues.standingJump}
                      onChange={(e) => handlePreciseChange('standingJump', e.target.value, 'standingJumpGrade')}
                      className="flex-1 accent-cyan-500"
                    />
                    <span className="font-mono font-black text-cyan-400 text-sm w-20 text-right">
                      {preciseValues.standingJump}cm ({paps.standingJumpGrade}등급)
                    </span>
                  </div>
                )}
              </div>

              {/* 3. 악력 */}
              <div className="bg-[#101217] p-3 rounded-lg border border-gray-800">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-black text-gray-200">
                    ③ 악력 (근력 / 손목 스냅 파워)
                  </span>
                  <span className="text-rose-400 font-bold">
                    → 강스파이크 타격 파워 & 서브 스피드
                  </span>
                </div>

                {!usePreciseValues ? (
                  <div className="grid grid-cols-5 gap-1.5 mt-2">
                    {[1, 2, 3, 4, 5].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handlePapsGradeChange('gripStrengthGrade', g)}
                        className={`py-1.5 px-1 rounded text-center text-xs font-black border transition ${
                          paps.gripStrengthGrade === g
                            ? 'bg-rose-500 text-white border-rose-400'
                            : 'bg-gray-800/80 text-gray-300 border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        {g}등급
                        <div className="text-[10px] opacity-70 font-normal">
                          {g === 1 ? '41kg↑' : g === 2 ? '35~40' : g === 3 ? '29~34' : g === 4 ? '23~28' : '22kg↓'}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min="15"
                      max="60"
                      value={preciseValues.gripStrength}
                      onChange={(e) => handlePreciseChange('gripStrength', e.target.value, 'gripStrengthGrade')}
                      className="flex-1 accent-rose-500"
                    />
                    <span className="font-mono font-black text-rose-400 text-sm w-16 text-right">
                      {preciseValues.gripStrength}kg ({paps.gripStrengthGrade}등급)
                    </span>
                  </div>
                )}
              </div>

              {/* 4. 앉아윗몸앞으로굽히기 (좌전굴) */}
              <div className="bg-[#101217] p-3 rounded-lg border border-gray-800">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-black text-gray-200">
                    ④ 앉아윗몸앞으로굽히기 (유연성)
                  </span>
                  <span className="text-emerald-400 font-bold">
                    → 슬라이딩 디그 반경 & 리시브 유연한 충격흡수
                  </span>
                </div>

                {!usePreciseValues ? (
                  <div className="grid grid-cols-5 gap-1.5 mt-2">
                    {[1, 2, 3, 4, 5].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handlePapsGradeChange('sitAndReachGrade', g)}
                        className={`py-1.5 px-1 rounded text-center text-xs font-black border transition ${
                          paps.sitAndReachGrade === g
                            ? 'bg-emerald-500 text-black border-emerald-400'
                            : 'bg-gray-800/80 text-gray-300 border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        {g}등급
                        <div className="text-[10px] opacity-70 font-normal">
                          {g === 1 ? '17cm↑' : g === 2 ? '10~16' : g === 3 ? '3~9' : g === 4 ? '-4~2' : '-5cm↓'}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min="-10"
                      max="30"
                      value={preciseValues.sitAndReach}
                      onChange={(e) => handlePreciseChange('sitAndReach', e.target.value, 'sitAndReachGrade')}
                      className="flex-1 accent-emerald-500"
                    />
                    <span className="font-mono font-black text-emerald-400 text-sm w-16 text-right">
                      {preciseValues.sitAndReach}cm ({paps.sitAndReachGrade}등급)
                    </span>
                  </div>
                )}
              </div>

              {/* 5. 윗몸일으키기 */}
              <div className="bg-[#101217] p-3 rounded-lg border border-gray-800">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-black text-gray-200">
                    ⑤ 윗몸일으키기 (근지구력 / 코어 힘)
                  </span>
                  <span className="text-purple-400 font-bold">
                    → 공중 자세 제어, 정밀 토스 밸런스 & 블로킹 벽
                  </span>
                </div>

                {!usePreciseValues ? (
                  <div className="grid grid-cols-5 gap-1.5 mt-2">
                    {[1, 2, 3, 4, 5].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handlePapsGradeChange('sitUpsGrade', g)}
                        className={`py-1.5 px-1 rounded text-center text-xs font-black border transition ${
                          paps.sitUpsGrade === g
                            ? 'bg-purple-500 text-white border-purple-400'
                            : 'bg-gray-800/80 text-gray-300 border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        {g}등급
                        <div className="text-[10px] opacity-70 font-normal">
                          {g === 1 ? '60회↑' : g === 2 ? '50~59' : g === 3 ? '40~49' : g === 4 ? '30~39' : '29회↓'}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min="15"
                      max="80"
                      value={preciseValues.sitUps}
                      onChange={(e) => handlePreciseChange('sitUps', e.target.value, 'sitUpsGrade')}
                      className="flex-1 accent-purple-500"
                    />
                    <span className="font-mono font-black text-purple-400 text-sm w-16 text-right">
                      {preciseValues.sitUps}회 ({paps.sitUpsGrade}등급)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
