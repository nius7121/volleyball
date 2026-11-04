# CLAUDE.md

## 프로젝트 개요
중학교 체육 수업용 9인제 배구 가상 경기. 학생이 PAPS 기반 캐릭터를 만들고, 선생님이 팀과 감독을 정하며, 감독 전술 확정 후 선생님 화면에서 경기가 진행된다.

## 꼭 지킬 조건
- **한 차시 일회용이다.** DB, 파일, Firebase, localStorage 등 영구 저장을 넣지 않는다. 저장이 생기면 개인정보 때문에 학교운영위원회 심의가 필요해진다.
- 실명, PAPS, 키, 성별, PIN이 다른 학생에게 전달되면 안 된다. `server/room.js`의 `publicCharacter`, `studentView`, `managerView`를 통해서만 내보낸다.
- 경기 전 전술은 상대 감독과 프로젝터(선생님 화면)에 노출하지 않는다. 경기 종료 후에만 공개한다.
- 9인제 전용이다. 하이큐의 실제 캐릭터, 학교 로고, 대사는 쓰지 않고 만화 연출만 참고한다.
- 화면은 밝은 코트 중계가 기본이고 명장면에만 흰 만화 컷을 쓴다. 이모지, 둥근 그림자 카드, 영문 장식 배지를 쓰지 않는다.

## 구조
- `shared/engine.js`: 랠리 시뮬레이션과 점수 규칙. 화면과 서버에 의존하지 않는다. 균형값은 `TUNING`.
- `shared/tactics.js`, `shared/paps.js`, `shared/constants.js`, `shared/npc.js`: 전술 상성, 스탯 환산, 규칙 상수, NPC
- `server/room.js`: 방 상태 머신과 역할별 화면 정보. 서버가 경기 결과를 결정한다.
- `server/index.js`: 정적 파일과 WebSocket, 역할별 명령 허용 목록
- `src/teacher/`: 선생님 화면 (팀 구성, 전술 대기, 코트와 동작 만화 칸, 결과)
- `src/student/`: 학생 화면, 감독 화면(라인업, 전술, 분석판)
- `src/components/`: 얼굴 아바타, 전신 동작 그림(`PoseFigure`), 캐릭터 제작, 공용 UI

## 명령어
- 수업 실행: `npm start` 또는 `수업시작.bat`
- 테스트: `npm test`
- 균형 측정: `npm run simulate` (엔진 수치를 바꾸면 다시 돌린다)
- 실제 서버 전체 흐름 점검: 서버 실행 후 `node scripts/classroom-check.js <선생님 key> [포트]`
- 개발: `npm run dev:server`와 `npm run dev`를 함께 실행
