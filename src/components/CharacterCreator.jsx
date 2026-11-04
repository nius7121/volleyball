import React, { useState } from 'react';
import CharacterAvatar from './CharacterAvatar';
import { StatBars } from './ui';
import { PAPS_BENCHMARK, PAPS_ITEMS, calculateVolleyballStats, gradeFromMeasure } from '../../shared/paps.js';
import { HAIR_BY_LOOK, ROLES } from '../../shared/constants.js';

const HAIR_COLORS = ['#18181B', '#451A03', '#7C2D12', '#E9540F', '#EAB308', '#94A3B8', '#14532D', '#B91C1C'];
const EYE_TYPES = [['fierce', '투지'], ['sharp', '날카로움'], ['calm', '차분함'], ['cat', '고양이 눈'], ['glasses', '안경']];
const SKIN_TONES = ['#FEF3C7', '#FDE68A', '#F5C77E', '#C98A4B', '#8D5A2B'];

const BLANK = {
  name: '',
  number: 7,
  gender: 'male',
  height: 160,
  hopePosition: 'WS',
  catchphrase: '',
  appearance: { look: 'boy', hairStyle: 'spiky', hairColor: '#18181B', skinTone: '#FDE68A', eyeType: 'fierce' },
  paps: { shuttleRunGrade: 3, standingJumpGrade: 3, gripStrengthGrade: 3, sitAndReachGrade: 3, sitUpsGrade: 3 },
};

function Section({ title, children }) {
  return (
    <section className="sheet p-4">
      <h2 className="mb-3 text-xl">{title}</h2>
      {children}
    </section>
  );
}

function Choice({ selected, onClick, children }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={`btn btn-small min-h-[44px] w-full ${selected ? 'btn-main' : ''}`}>
      {children}
    </button>
  );
}

function PapsRow({ item, gender, grade, onGrade }) {
  const [measure, setMeasure] = useState('');
  const table = PAPS_BENCHMARK[gender][item.key];
  const applyMeasure = (value) => {
    setMeasure(value);
    if (value !== '' && Number.isFinite(Number(value))) onGrade(gradeFromMeasure(gender, item.key, Number(value)));
  };
  return (
    <div className="border-t-2 border-line pt-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-bold">{item.name}</span>
        <span className="text-sm text-muted">{item.helps}에 영향</span>
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1">
        {table.map((row) => (
          <button
            key={row.grade}
            type="button"
            aria-pressed={grade === row.grade}
            title={row.label}
            onClick={() => onGrade(row.grade)}
            className={`btn btn-small min-h-[44px] px-0 ${grade === row.grade ? 'btn-main' : ''}`}
          >
            {row.grade}등급
          </button>
        ))}
      </div>
      <label className="mt-2 flex items-center gap-2 text-sm">
        <span className="shrink-0 text-muted">측정값을 알면</span>
        <input type="number" inputMode="decimal" value={measure} onChange={(e) => applyMeasure(e.target.value)} placeholder={`${item.unit} 입력`} className="min-h-[38px] w-28 py-1" />
        <span className="text-muted">{table.find((r) => r.grade === grade)?.label}</span>
      </label>
    </div>
  );
}

export default function CharacterCreator({ initial, onSave, onCancel, saveLabel = '선수 등록' }) {
  const [draft, setDraft] = useState(() => ({ ...BLANK, ...initial, appearance: { ...BLANK.appearance, ...initial?.appearance }, paps: { ...BLANK.paps, ...initial?.paps } }));
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const look = (patch) => setDraft((d) => ({ ...d, appearance: { ...d.appearance, ...patch } }));
  // 모습을 바꾸면 그 모습에 없는 머리 모양은 첫 번째 머리로 돌린다.
  const lookPatch = (nextLook, hairStyle) => ({
    look: nextLook,
    hairStyle: HAIR_BY_LOOK[nextLook].some(([id]) => id === hairStyle) ? hairStyle : HAIR_BY_LOOK[nextLook][0][0],
  });
  const chooseLook = (nextLook) => look(lookPatch(nextLook, draft.appearance.hairStyle));
  const chooseGender = (gender) => setDraft((d) => ({
    ...d,
    gender,
    appearance: { ...d.appearance, ...lookPatch(gender === 'female' ? 'girl' : 'boy', d.appearance.hairStyle) },
  }));
  const stats = calculateVolleyballStats(draft.paps, Number(draft.height) || 160, draft.hopePosition);
  const canSave = draft.name.trim().length > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-5 pb-24">
      <header>
        <h1 className="cut-title text-2xl">내 선수 만들기</h1>
        <p className="mt-2 text-sm text-muted">PAPS 등급과 키는 나와 선생님만 봅니다. 친구들에게는 배구 능력치만 보입니다. 수업이 끝나면 모두 지워집니다.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-[17rem_1fr]">
        <aside className="sheet self-start p-4 md:sticky md:top-4">
          <div className="flex items-center gap-4 md:block">
            <CharacterAvatar appearance={draft.appearance} number={draft.number} teamColor="#E9540F" secondaryColor="#16161A" size={120} className="md:mx-auto md:block" />
            <div className="md:mt-2 md:text-center">
              <div className="font-display text-2xl">{draft.name || '선수 이름'}</div>
              <div className="text-sm text-muted">{ROLES[draft.hopePosition].name} 희망</div>
            </div>
          </div>
          <div className="mt-3"><StatBars stats={stats} color="#E9540F" /></div>
        </aside>

        <div className="space-y-4">
          <Section title="기본 정보">
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 block text-sm font-bold">
                코트에서 쓸 이름 (10자 이내)
                <input maxLength={10} value={draft.name} onChange={(e) => set({ name: e.target.value })} className="mt-1" placeholder="별명도 좋아요" />
              </label>
              <label className="block text-sm font-bold">
                등번호
                <input type="number" min="1" max="99" value={draft.number} onChange={(e) => set({ number: e.target.value })} className="mt-1" />
              </label>
              <label className="block text-sm font-bold">
                키 (cm)
                <input type="number" min="130" max="200" value={draft.height} onChange={(e) => set({ height: e.target.value })} className="mt-1" />
              </label>
              <div className="col-span-2">
                <div className="mb-1 text-sm font-bold">PAPS 기준표</div>
                <div className="grid grid-cols-2 gap-2">
                  <Choice selected={draft.gender === 'male'} onClick={() => chooseGender('male')}>남학생</Choice>
                  <Choice selected={draft.gender === 'female'} onClick={() => chooseGender('female')}>여학생</Choice>
                </div>
              </div>
              <label className="col-span-2 block text-sm font-bold">
                각오 한마디 (30자 이내, 명장면에 나와요)
                <input maxLength={30} value={draft.catchphrase} onChange={(e) => set({ catchphrase: e.target.value })} className="mt-1" placeholder="공이 떨어질 때까지 끝이 아니다!" />
              </label>
            </div>
          </Section>

          <Section title="희망 포지션">
            <p className="mb-2 text-sm text-muted">실제 자리는 감독이 정합니다. 자리에 따라 능력치 보너스가 달라져요.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(ROLES).map(([id, role]) => (
                <button key={id} type="button" aria-pressed={draft.hopePosition === id} onClick={() => set({ hopePosition: id })} className={`btn h-full flex-col px-2 py-2 ${draft.hopePosition === id ? 'btn-main' : ''}`}>
                  <span>{role.name}</span>
                  <span className="text-xs font-normal">{role.desc}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="외형">
            <div className="text-sm font-bold">캐릭터 모습</div>
            <p className="mb-1 text-sm text-muted">PAPS 기준표를 따라 정해지지만 원하는 모습으로 바꿀 수 있어요. 모습은 친구들에게도 보입니다.</p>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <Choice selected={draft.appearance.look === 'boy'} onClick={() => chooseLook('boy')}>남자 모습</Choice>
              <Choice selected={draft.appearance.look === 'girl'} onClick={() => chooseLook('girl')}>여자 모습</Choice>
            </div>
            <div className="mb-1 text-sm font-bold">머리 모양</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {HAIR_BY_LOOK[draft.appearance.look].map(([id, name]) => <Choice key={id} selected={draft.appearance.hairStyle === id} onClick={() => look({ hairStyle: id })}>{name}</Choice>)}
            </div>
            <div className="mt-3 text-sm font-bold">머리색</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {HAIR_COLORS.map((color) => (
                <button key={color} type="button" aria-label={`머리색 ${color}`} aria-pressed={draft.appearance.hairColor === color} onClick={() => look({ hairColor: color })} className={`h-10 w-10 border-2 ${draft.appearance.hairColor === color ? 'border-ink outline outline-2 outline-offset-2 outline-ink' : 'border-ink'}`} style={{ background: color }} />
              ))}
            </div>
            <div className="mt-3 text-sm font-bold">피부색</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {SKIN_TONES.map((color) => (
                <button key={color} type="button" aria-label={`피부색 ${color}`} aria-pressed={draft.appearance.skinTone === color} onClick={() => look({ skinTone: color })} className={`h-10 w-10 border-2 border-ink ${draft.appearance.skinTone === color ? 'outline outline-2 outline-offset-2 outline-ink' : ''}`} style={{ background: color }} />
              ))}
            </div>
            <div className="mt-3 text-sm font-bold">눈매</div>
            <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {EYE_TYPES.map(([id, name]) => <Choice key={id} selected={draft.appearance.eyeType === id} onClick={() => look({ eyeType: id })}>{name}</Choice>)}
            </div>
          </Section>

          <Section title="PAPS 등급">
            <div className="space-y-3">
              {PAPS_ITEMS.map((item) => (
                <PapsRow key={`${item.key}_${draft.gender}`} item={item} gender={draft.gender} grade={draft.paps[item.gradeKey]} onGrade={(g) => setDraft((d) => ({ ...d, paps: { ...d.paps, [item.gradeKey]: g } }))} />
              ))}
            </div>
          </Section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-ink bg-paper p-3">
        <div className="mx-auto flex max-w-4xl gap-2">
          {onCancel && <button type="button" className="btn" onClick={onCancel}>취소</button>}
          <button type="button" className="btn btn-a flex-1 text-lg" disabled={!canSave} onClick={() => onSave({ ...draft, number: Number(draft.number), height: Number(draft.height) })}>
            {canSave ? saveLabel : '코트에서 쓸 이름을 적어 주세요'}
          </button>
        </div>
      </div>
    </div>
  );
}
