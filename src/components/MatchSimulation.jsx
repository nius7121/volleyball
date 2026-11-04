import React, { useState, useEffect, useRef } from 'react';
import Court2D from './Court2D';
import CutinScene from './CutinScene';
import TimeoutModal from './TimeoutModal';
import SubModal from './SubModal';
import MatchResultModal from './MatchResultModal';
import { sound } from '../utils/audio';
import { Play, Pause, FastForward, Volume2, VolumeX, Clock, ArrowRightLeft, Shield, Zap, Sparkles } from './Icons';

export default function MatchSimulation({
  teams,
  charMap,
  gameMode = '6person',
  onChangeGameMode,
  onModifyTactics,
  onResetToRoster
}) {
  const is9Man = gameMode === '9person';
  const targetScore = is9Man ? 21 : 25; // 9인제는 21점, 6인제는 25점
  const maxStarters = is9Man ? 9 : 6;

  // 팀 상태 복사본 (세트 중 교체/타임아웃 횟수 갱신)
  const [currentTeams, setCurrentTeams] = useState(teams);

  // 경기 점수 상태
  const [matchState, setMatchState] = useState({
    currentSet: 1,
    teamAScore: 0,
    teamBScore: 0,
    setScores: [],
    teamASetsWon: 0,
    teamBSetsWon: 0,
    isSetOver: false,
    isGameOver: false,
    winner: null,
    servingTeam: 'teamA'
  });

  // 6인제 로테이션 상태
  const [rotationA, setRotationA] = useState([0, 1, 2, 3, 4, 5]);
  const [rotationB, setRotationB] = useState([0, 1, 2, 3, 4, 5]);

  // 시뮬레이션 재생 제어
  const [isPlaying, setIsPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // 배구공 위치 및 연출 상태
  const [ballPos, setBallPos] = useState({ x: is9Man ? 14 : 18, y: 78, z: 0, state: 'idle' });
  const [activeAction, setActiveAction] = useState(null);
  const [cutin, setCutin] = useState(null);

  // 작전타임 & 교체 모달 상태
  const [timeoutModal, setTimeoutModal] = useState({ isOpen: false, teamKey: 'teamA' });
  const [subModal, setSubModal] = useState({ isOpen: false, teamKey: 'teamA' });

  // 중계 로그
  const [commentary, setCommentary] = useState([
    {
      id: 1,
      text: `★ ${is9Man ? '9인제 (21점 매치·3열 수비망)' : '6인제 (25점 매치·FIVB 룰)'} 배구 경기 시작! 양 팀 코트에 정렬합니다.`,
      time: '00:00'
    }
  ]);

  const rallyTimerRef = useRef(null);

  // 모드 변경 시 세트 점수 초기화
  useEffect(() => {
    setCurrentTeams(teams);
    setMatchState({
      currentSet: 1,
      teamAScore: 0,
      teamBScore: 0,
      setScores: [],
      teamASetsWon: 0,
      teamBSetsWon: 0,
      isSetOver: false,
      isGameOver: false,
      winner: null,
      servingTeam: 'teamA'
    });
    addCommentary(`★ 모드 변경: [${is9Man ? '9인제 배구 (21점제)' : '6인제 배구 (25점제)'}]로 경기 설정이 갱신되었습니다.`);
  }, [gameMode]);

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const addCommentary = (text) => {
    setCommentary(prev => [
      { id: Date.now() + Math.random(), text, time: new Date().toLocaleTimeString('ko-KR', { minute: '2-digit', second: '2-digit' }) },
      ...prev.slice(0, 40)
    ]);
  };

  // 1포인트 랠리 시뮬레이션
  const playOneRally = () => {
    if (matchState.isSetOver || matchState.isGameOver) return;

    sound.playWhistle();

    const teamA = currentTeams.teamA;
    const teamB = currentTeams.teamB;

    const serverTeamKey = matchState.servingTeam;
    const isAServing = serverTeamKey === 'teamA';
    const serverTeam = isAServing ? teamA : teamB;
    const receiverTeam = isAServing ? teamB : teamA;

    // 서버 선수 결정
    let serverCharId;
    if (is9Man) {
      // 9인제는 후위 라이트(8번 슬롯) 선수가 서버
      serverCharId = serverTeam.starterIds[8] || serverTeam.starterIds[0];
    } else {
      // 6인제는 로테이션 0번 선수
      serverCharId = isAServing
        ? teamA.starterIds[rotationA[0] % teamA.starterIds.length]
        : teamB.starterIds[rotationB[0] % teamB.starterIds.length];
    }
    const serverChar = charMap.get(serverCharId);

    // 공 시작 위치: 서브 엔드라인
    setBallPos({
      x: isAServing ? (is9Man ? 14 : 18) : (is9Man ? 86 : 82),
      y: isAServing ? 78 : 22,
      z: 10,
      state: 'serve'
    });

    setActiveAction({
      text: `${serverChar?.name.split(' ')[0]} SERVE!!`,
      color: isAServing ? '#FF5722' : '#DC2626'
    });

    const serveStat = serverChar?.stats.serve || 70;
    const serveRisk = serverTeam.tactics.serveRisk;

    let aceChance = (serveStat / 100) * 0.14;
    let faultChance = 0.05;

    if (serveRisk === 'aggressive') {
      aceChance += 0.12;
      faultChance += 0.08;
    } else if (serveRisk === 'safety_floater') {
      aceChance += 0.05;
      faultChance = 0.02;
    }

    const rand = Math.random();

    // 9인제 룰: 1차 서브 범실 시 2nd 서브 기회 제공!
    if (rand < faultChance) {
      if (is9Man && Math.random() < 0.7) {
        addCommentary(`[1st 서브 폴트] ${serverChar?.name}의 1차 서브가 네트에 걸렸습니다! ➔ 9인제 룰: [2nd 서브 기회] 부여!`);
        // 2nd 서브는 안전 서브로 랠리 속행
        sound.playToss();
      } else {
        sound.playWhistle();
        const scoringTeam = isAServing ? 'teamB' : 'teamA';
        addCommentary(`[서브 범실] ${serverChar?.name}의 서브 아웃! 상대 팀 득점.`);
        scorePoint(scoringTeam);
        return;
      }
    }

    // 서비스 에이스 터짐!
    if (rand >= faultChance && rand < faultChance + aceChance) {
      sound.playSpike();
      setBallPos({
        x: isAServing ? 75 : 25,
        y: 50,
        z: 0,
        state: 'ace'
      });
      setCutin({
        player: serverChar,
        actionType: 'ace',
        slogan: serverChar?.catchphrase || '무회전 탄환 에이스!!',
        teamColor: isAServing ? teamA.primaryColor : teamB.primaryColor
      });
      addCommentary(`💥 [서비스 에이스!!] ${serverChar?.name}의 강력한 서브가 코트 빈틈을 정확히 꿰뚫었습니다!`);
      scorePoint(serverTeamKey);
      return;
    }

    // 리시브 후 랠리 진행
    sound.playDig();
    setBallPos({
      x: isAServing ? 65 : 35,
      y: 50,
      z: 20,
      state: 'receive'
    });

    const attackingTeamKey = isAServing ? 'teamB' : 'teamA';
    const defendingTeamKey = isAServing ? 'teamA' : 'teamB';
    const attackingTeam = currentTeams[attackingTeamKey];
    const defendingTeam = currentTeams[defendingTeamKey];

    // 공격수: 전위 3명(0, 1, 2) 중 스파이크 파워 높은 선수
    const attackerCharId = attackingTeam.starterIds[1] || attackingTeam.starterIds[0];
    const attackerChar = charMap.get(attackerCharId);

    // 블로커: 수비팀 전위 블로커
    const blockerCharId = defendingTeam.starterIds[1] || defendingTeam.starterIds[0];
    const blockerChar = charMap.get(blockerCharId);

    const spikePower = attackerChar?.stats.spike || 75;
    const blockPower = blockerChar?.stats.block || 70;

    let spikeAdvantage = (spikePower - blockPower) + (Math.random() * 30 - 15);

    if (attackingTeam.tactics.attackStyle === 'quick_tempo') {
      spikeAdvantage += 12;
    } else if (defendingTeam.tactics.blockSystem === 'read_block') {
      spikeAdvantage -= 8;
    }

    // 9인제는 중위/후위 6인 다인 수비망이 있어 디그 확률이 더 높음!
    if (is9Man) {
      spikeAdvantage -= 5;
    }

    setTimeout(() => {
      setBallPos({
        x: isAServing ? 40 : 60,
        y: 45,
        z: 35,
        state: 'spike'
      });

      if (spikeAdvantage > 12) {
        sound.playSpike();
        setCutin({
          player: attackerChar,
          actionType: 'spike',
          slogan: attackerChar?.catchphrase || '최고 타점에서 내리꽂는다!!',
          teamColor: attackingTeam.primaryColor
        });
        addCommentary(`⚡ [스파이크 강타!!] ${attackerChar?.name}의 타점 높은 스파이크가 블로킹 벽을 통쾌하게 뚫어냅니다!`);
        scorePoint(attackingTeamKey);
      } else if (spikeAdvantage < -12) {
        sound.playBlock();
        setCutin({
          player: blockerChar,
          actionType: 'block',
          slogan: blockerChar?.catchphrase || '철벽 셧아웃!! 지나갈 수 없다!',
          teamColor: defendingTeam.primaryColor
        });
        addCommentary(`🛑 [블로킹 셧아웃!!] ${blockerChar?.name}의 단단한 블로킹 벽! 상대 스파이크를 전위에서 차단합니다!`);
        scorePoint(defendingTeamKey);
      } else {
        sound.playDig();
        const luckyScorer = Math.random() > 0.5 ? attackingTeamKey : defendingTeamKey;
        const scorerName = luckyScorer === attackingTeamKey ? attackerChar?.name : blockerChar?.name;
        if (is9Man) {
          addCommentary(`🔥 [9인제 그물망 수비전] 중위-후위 6인의 촘촘한 디그 연계 후 ${scorerName}이 결정타를 뽑아냅니다!`);
        } else {
          addCommentary(`🔥 [슈퍼 랠리 득점] 코트를 가르는 치열한 공방전 끝에 ${scorerName}이 득점 성공!`);
        }
        scorePoint(luckyScorer);
      }
    }, 450);
  };

  // 득점 처리
  const scorePoint = (scoringTeamKey) => {
    sound.playCheer();

    setMatchState(prev => {
      const newScoreA = scoringTeamKey === 'teamA' ? prev.teamAScore + 1 : prev.teamAScore;
      const newScoreB = scoringTeamKey === 'teamB' ? prev.teamBScore + 1 : prev.teamBScore;

      let nextServer = prev.servingTeam;
      if (scoringTeamKey !== prev.servingTeam) {
        nextServer = scoringTeamKey;
        if (!is9Man) {
          // 6인제 로테이션 회전
          if (scoringTeamKey === 'teamA') {
            setRotationA(rot => [...rot.slice(1), rot[0]]);
          } else {
            setRotationB(rot => [...rot.slice(1), rot[0]]);
          }
        }
      }

      // 세트 종료 판정 (6인제: 25점, 9인제: 21점, 듀스 2점 차)
      const setWonA = newScoreA >= targetScore && newScoreA - newScoreB >= 2;
      const setWonB = newScoreB >= targetScore && newScoreB - newScoreA >= 2;

      if (setWonA || setWonB) {
        const winningTeam = setWonA ? 'teamA' : 'teamB';
        const newSetsWonA = setWonA ? prev.teamASetsWon + 1 : prev.teamASetsWon;
        const newSetsWonB = setWonB ? prev.teamBSetsWon + 1 : prev.teamBSetsWon;

        const newSetScores = [
          ...prev.setScores,
          { setNum: prev.currentSet, teamAScore: newScoreA, teamBScore: newScoreB }
        ];

        const isGameFinished = newSetsWonA >= 2 || newSetsWonB >= 2;

        return {
          ...prev,
          teamAScore: newScoreA,
          teamBScore: newScoreB,
          teamASetsWon: newSetsWonA,
          teamBSetsWon: newSetsWonB,
          setScores: newSetScores,
          isSetOver: true,
          isGameOver: isGameFinished,
          winner: isGameFinished ? (newSetsWonA >= 2 ? 'teamA' : 'teamB') : null,
          servingTeam: nextServer
        };
      }

      return {
        ...prev,
        teamAScore: newScoreA,
        teamBScore: newScoreB,
        servingTeam: nextServer
      };
    });
  };

  useEffect(() => {
    if (isPlaying && !matchState.isSetOver && !matchState.isGameOver) {
      const delay = Math.max(800, 2400 / simSpeed);
      rallyTimerRef.current = setTimeout(() => {
        playOneRally();
      }, delay);
    }
    return () => {
      if (rallyTimerRef.current) clearTimeout(rallyTimerRef.current);
    };
  }, [isPlaying, matchState, simSpeed]);

  useEffect(() => {
    if (matchState.isSetOver) {
      setIsPlaying(false);
    }
  }, [matchState.isSetOver]);

  const handleCallTimeout = (teamKey) => {
    const team = currentTeams[teamKey];
    if (team.timeoutsRemaining <= 0) {
      alert(`${team.name}의 작전 타임 2회를 모두 사용했습니다.`);
      return;
    }

    setIsPlaying(false);
    sound.playTimeoutBuzzer();

    setCurrentTeams(prev => ({
      ...prev,
      [teamKey]: {
        ...prev[teamKey],
        timeoutsRemaining: prev[teamKey].timeoutsRemaining - 1
      }
    }));

    addCommentary(`⏱️ [작전 타임!] ${team.name} 감독이 흐름을 끊기 위해 작전 타임을 요청했습니다.`);
    setTimeoutModal({ isOpen: true, teamKey });
  };

  const handleOpenSubModal = (teamKey) => {
    const team = currentTeams[teamKey];
    const maxSubs = is9Man ? 9 : 6;
    if ((team.substitutionsRemaining ?? maxSubs) <= 0) {
      alert(`${team.name}의 이번 세트 교체 횟수(${maxSubs}회)를 모두 소진했습니다.`);
      return;
    }
    setIsPlaying(false);
    setSubModal({ isOpen: true, teamKey });
  };

  const handlePerformSub = (teamKey, outId, inId) => {
    const team = currentTeams[teamKey];
    const outChar = charMap.get(outId);
    const inChar = charMap.get(inId);

    const newStarters = team.starterIds.map(id => (id === outId ? inId : id));
    const newBench = team.benchIds.map(id => (id === inId ? outId : id));

    const maxSubs = is9Man ? 9 : 6;
    const updatedRemaining = (team.substitutionsRemaining ?? maxSubs) - 1;

    setCurrentTeams(prev => ({
      ...prev,
      [teamKey]: {
        ...prev[teamKey],
        starterIds: newStarters,
        benchIds: newBench,
        substitutionsRemaining: updatedRemaining
      }
    }));

    addCommentary(
      `🔄 [선수 교체] ${team.name}: OUT #${outChar?.number} ${outChar?.name} ➔ IN #${inChar?.number} ${inChar?.name} (남은 교체: ${updatedRemaining}/${maxSubs})`
    );
  };

  const handleNextSet = () => {
    setMatchState(prev => ({
      ...prev,
      currentSet: prev.currentSet + 1,
      teamAScore: 0,
      teamBScore: 0,
      isSetOver: false
    }));

    const maxSubs = is9Man ? 9 : 6;
    setCurrentTeams(prev => ({
      teamA: { ...prev.teamA, substitutionsRemaining: maxSubs, timeoutsRemaining: 2 },
      teamB: { ...prev.teamB, substitutionsRemaining: maxSubs, timeoutsRemaining: 2 }
    }));

    addCommentary(`★ 제 ${matchState.currentSet + 1}세트 개시! (${is9Man ? '21점제' : '25점제'})`);
  };

  const handleRestartMatch = () => {
    setMatchState({
      currentSet: 1,
      teamAScore: 0,
      teamBScore: 0,
      setScores: [],
      teamASetsWon: 0,
      teamBSetsWon: 0,
      isSetOver: false,
      isGameOver: false,
      winner: null,
      servingTeam: 'teamA'
    });
    setCurrentTeams(teams);
    addCommentary(`★ 새로운 ${is9Man ? '9인제' : '6인제'} 매치가 시작되었습니다!`);
  };

  const teamA = currentTeams.teamA;
  const teamB = currentTeams.teamB;

  return (
    <div className="space-y-4">
      {/* 1. 상단 전광판 (Haikyu Electronic Scoreboard) */}
      <div className="bg-[#111216] border-4 border-[#232734] rounded-2xl p-4 shadow-haikyu-lg relative overflow-hidden">
        {/* 모드 배너 토글 */}
        <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
              배구 룰 모드:
            </span>
            <div className="flex bg-[#1a1c24] rounded-lg p-0.5 border border-gray-700">
              <button
                onClick={() => onChangeGameMode('6person')}
                className={`px-2.5 py-0.5 rounded text-xs font-black transition ${
                  !is9Man ? 'bg-haikyu-orange text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                6인제 (25점 매치)
              </button>
              <button
                onClick={() => onChangeGameMode('9person')}
                className={`px-2.5 py-0.5 rounded text-xs font-black transition ${
                  is9Man ? 'bg-haikyu-yellow text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                9인제 (21점 매치·3열 수비)
              </button>
            </div>
          </div>
          <span className="text-[11px] text-gray-400 font-bold hidden sm:inline">
            {is9Man ? '🏆 9인제 21점 매치 | 2nd 서브 기회 | 3열(전·중·후위) 수비망' : '🏆 6인제 FIVB 25점 매치 | 6인 로테이션 | 리베로 제도'}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* TEAM A 정보 */}
          <div className="flex-1 min-w-[200px] flex items-center gap-3">
            <div className="w-3 h-12 bg-haikyu-orange rounded-full" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-haikyu-orange text-black">
                  SET {matchState.teamASetsWon}승
                </span>
                <span className="text-xs text-haikyu-orange font-bold">"{teamA.motto}"</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white haikyu-title">{teamA.name}</h3>
              <div className="text-[11px] text-gray-400 mt-0.5">
                남은 타임아웃: <span className="text-amber-400 font-bold">{teamA.timeoutsRemaining}회</span> | 교체: <span className="text-yellow-400 font-bold">{teamA.substitutionsRemaining}/{is9Man ? 9 : 6}회</span>
              </div>
            </div>
          </div>

          {/* 중앙 메인 대형 전광판 스코어 */}
          <div className="flex flex-col items-center justify-center px-6 py-2 bg-[#08090b] rounded-xl border-2 border-gray-800 shadow-inner">
            <div className="text-[11px] font-black text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-2">
              <span className="animate-pulse w-2 h-2 rounded-full bg-red-500" />
              SET {matchState.currentSet} / 3 ({targetScore}점 승부)
            </div>

            <div className="flex items-center gap-4 sm:gap-6 font-mono font-black text-4xl sm:text-5xl tracking-tight">
              <span className="text-haikyu-orange drop-shadow-md">
                {String(matchState.teamAScore).padStart(2, '0')}
              </span>
              <span className="text-gray-600 text-3xl">:</span>
              <span className="text-red-500 drop-shadow-md">
                {String(matchState.teamBScore).padStart(2, '0')}
              </span>
            </div>

            <div className="text-[10px] font-bold text-gray-500 mt-1">
              서브권: {matchState.servingTeam === 'teamA' ? teamA.name : teamB.name}
            </div>
          </div>

          {/* TEAM B 정보 */}
          <div className="flex-1 min-w-[200px] flex items-center justify-end gap-3 text-right">
            <div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-red-400 font-bold">"{teamB.motto}"</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white">
                  SET {matchState.teamBSetsWon}승
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white haikyu-title">{teamB.name}</h3>
              <div className="text-[11px] text-gray-400 mt-0.5">
                남은 타임아웃: <span className="text-amber-400 font-bold">{teamB.timeoutsRemaining}회</span> | 교체: <span className="text-yellow-400 font-bold">{teamB.substitutionsRemaining}/{is9Man ? 9 : 6}회</span>
              </div>
            </div>
            <div className="w-3 h-12 bg-red-600 rounded-full" />
          </div>
        </div>

        {/* 경기 컨트롤 바 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={matchState.isSetOver || matchState.isGameOver}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-haikyu transition disabled:opacity-50 ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-black'
                  : 'bg-haikyu-orange hover:bg-orange-600 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-white" />}
              {isPlaying ? '일시 정지' : '경기 진행 (Auto)'}
            </button>

            <button
              onClick={playOneRally}
              disabled={isPlaying || matchState.isSetOver || matchState.isGameOver}
              className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold border border-gray-700 transition disabled:opacity-50"
            >
              다음 1구 (Manual)
            </button>

            {/* 배속 조절 */}
            <div className="flex bg-[#1b1e28] rounded-xl p-0.5 border border-gray-700 text-xs">
              {[1, 2, 4].map(s => (
                <button
                  key={s}
                  onClick={() => setSimSpeed(s)}
                  className={`px-2 py-1 rounded-lg font-black transition ${
                    simSpeed === s ? 'bg-haikyu-orange text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* 효과음 토글 */}
            <button
              onClick={handleToggleMute}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl border border-gray-700 transition"
              title={isMuted ? '음소거 해제' : '음소거'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>

          {/* 양 팀 감독 즉시 작전/교체 버튼 */}
          <div className="flex items-center gap-2">
            {/* Team A 지휘 */}
            <div className="flex items-center gap-1 bg-orange-950/40 border border-orange-800/60 p-1 rounded-xl">
              <span className="text-[10px] font-black text-haikyu-orange px-1">팀 A:</span>
              <button
                onClick={() => handleCallTimeout('teamA')}
                disabled={teamA.timeoutsRemaining <= 0}
                className="px-2 py-1 bg-haikyu-orange hover:bg-orange-600 disabled:opacity-40 text-black text-[11px] font-black rounded-lg flex items-center gap-1 shadow-sm"
              >
                <Clock className="w-3 h-3" /> 작전타임
              </button>
              <button
                onClick={() => handleOpenSubModal('teamA')}
                disabled={(teamA.substitutionsRemaining ?? (is9Man ? 9 : 6)) <= 0}
                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black text-[11px] font-black rounded-lg flex items-center gap-1 shadow-sm"
              >
                <ArrowRightLeft className="w-3 h-3" /> 선수교체
              </button>
            </div>

            {/* Team B 지휘 */}
            <div className="flex items-center gap-1 bg-red-950/40 border border-red-800/60 p-1 rounded-xl">
              <span className="text-[10px] font-black text-red-500 px-1">팀 B:</span>
              <button
                onClick={() => handleCallTimeout('teamB')}
                disabled={teamB.timeoutsRemaining <= 0}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-[11px] font-black rounded-lg flex items-center gap-1 shadow-sm"
              >
                <Clock className="w-3 h-3" /> 작전타임
              </button>
              <button
                onClick={() => handleOpenSubModal('teamB')}
                disabled={(teamB.substitutionsRemaining ?? (is9Man ? 9 : 6)) <= 0}
                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-[11px] font-black rounded-lg flex items-center gap-1 shadow-sm"
              >
                <ArrowRightLeft className="w-3 h-3" /> 선수교체
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 메인 배구 코트 시각화 (6인제 or 9인제) */}
      <Court2D
        teamA={teamA}
        teamB={teamB}
        charMap={charMap}
        gameMode={gameMode}
        ballPos={ballPos}
        activeAction={activeAction}
        servingTeam={matchState.servingTeam}
        rotationA={rotationA}
        rotationB={rotationB}
      />

      {/* 3. 하이큐 만화 액션 피드 & 실시간 중계 텍스트 */}
      <div className="bg-[#12141a] border-2 border-gray-800 rounded-2xl p-4 shadow-haikyu">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-800">
          <span className="text-xs font-black text-haikyu-orange uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            하이큐 {is9Man ? '9인제' : '6인제'} 실시간 랠리 중계 & 전술 로그
          </span>
          <span className="text-[10px] text-gray-500">Live Match Log</span>
        </div>

        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs font-medium">
          {commentary.map(c => (
            <div key={c.id} className="flex items-start gap-2 text-gray-300">
              <span className="font-mono text-[10px] text-gray-500 flex-shrink-0 mt-0.5">[{c.time}]</span>
              <span className="leading-relaxed">{c.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. 애니메이션 컷신 오버레이 */}
      <CutinScene cutin={cutin} onFinish={() => setCutin(null)} />

      {/* 5. 감독 작전 타임 모달 */}
      {timeoutModal.isOpen && (
        <TimeoutModal
          callingTeam={timeoutModal.teamKey}
          teams={currentTeams}
          onApplyTactics={(teamKey, updatedTactics) => {
            setCurrentTeams(prev => ({
              ...prev,
              [teamKey]: { ...prev[teamKey], tactics: updatedTactics }
            }));
            addCommentary(`📋 [전술 수정] ${currentTeams[teamKey].name}의 감독 작전이 업데이트되었습니다.`);
          }}
          onClose={() => setTimeoutModal({ isOpen: false, teamKey: 'teamA' })}
        />
      )}

      {/* 6. 선수 교체 모달 */}
      {subModal.isOpen && (
        <SubModal
          callingTeam={subModal.teamKey}
          teams={currentTeams}
          charMap={charMap}
          gameMode={gameMode}
          onPerformSub={handlePerformSub}
          onClose={() => setSubModal({ isOpen: false, teamKey: 'teamA' })}
        />
      )}

      {/* 7. 세트 종료 / 경기 종료 종합 결과 모달 */}
      {matchState.isSetOver && (
        <MatchResultModal
          matchState={matchState}
          teams={currentTeams}
          charMap={charMap}
          onNextSet={handleNextSet}
          onModifyTactics={onModifyTactics}
          onRestartMatch={handleRestartMatch}
        />
      )}
    </div>
  );
}
