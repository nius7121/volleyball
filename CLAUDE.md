# CLAUDE.md - 하이큐 배구 가상 경기 프로젝트 지침

## 프로젝트 개요
중학교 **PAPS(학생건강체력평가제)** 기준표 기반 캐릭터 능력치 환산 및 **하이큐!!** 컨셉의 6인제 & 9인제 배구 가상 경기 시뮬레이터입니다.

## 기술 스택
- **프론트엔드**: React 18, Vite 6, Tailwind CSS
- **이펙트 & 사운드**: Canvas Confetti, Web Audio API 네이티브 사운드 엔진 (`src/utils/audio.js`)
- **아이콘**: 커스텀 내장 SVG 아이콘 (`src/components/Icons.jsx`)

## 주요 파일 구조
- `src/data/papsData.js`: 중학교 PAPS 5대 종목 기준표 및 배구 6대 스탯(Spike, Block, Serve, Receive, Toss, Speed/Stamina) 환산 공식
- `src/data/defaultCharacters.js`: 하이큐 오마주 기본 선수 데이터 20명 및 6인제/9인제 기본 팀 라인업
- `src/data/volleyballTactics.js`: 서브/공격/블로킹 전술 옵션 및 상성 보너스
- `src/components/Court2D.jsx`: 2.5D 배구 코트 뷰 (6인제 로테이션 및 9인제 3열 3x3 포메이션 지원)
- `src/components/MatchSimulation.jsx`: 실시간 배구 랠리 시뮬레이션 엔진 (6인제 25점 / 9인제 21점, 2nd 서브 기회 등)
- `src/components/SubModal.jsx`: FIVB 룰 교체 & 원포인트 서버/블로커 추천
- `src/components/TimeoutModal.jsx`: 감독 작전 타임 (세트당 2회, 체력 회복 및 즉시 전술 수정)
- `src/components/CutinScene.jsx`: 하이큐 만화 액션 컷신 연출
- `src/components/CharacterCreator.jsx`: PAPS 수치 입력 및 SVG 캐릭터 외형 메이커
- `src/components/TeamBuilder.jsx`: 6인제 및 9인제 선발 라인업 배분

## 개발 명령어
- 로컬 실행: `npm run dev` (기본 포트 3000)
- 프로덕션 빌드: `npm run build`
