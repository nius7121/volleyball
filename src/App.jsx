import React, { useState, useEffect } from 'react';
import CharacterCreator from './components/CharacterCreator';
import CharacterCard from './components/CharacterCard';
import TeamBuilder from './components/TeamBuilder';
import TacticBoard from './components/TacticBoard';
import MatchSimulation from './components/MatchSimulation';
import { DEFAULT_CHARACTERS, INITIAL_TEAMS } from './data/defaultCharacters';
import { Users, Shield, Play, Plus, Sparkles, SlidersHorizontal, Trophy } from './components/Icons';

const STORAGE_KEY_CHARS = 'haikyu_volleyball_characters_v2';
const STORAGE_KEY_TEAMS = 'haikyu_volleyball_teams_v2';
const STORAGE_KEY_MODE = 'haikyu_volleyball_mode_v2';

export default function App() {
  // 6인제 vs 9인제 배구 모드 ('6person' | '9person')
  const [gameMode, setGameMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_MODE) || '6person';
    } catch {
      return '6person';
    }
  });

  // 1. 등록된 선수 목록
  const [characters, setCharacters] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHARS);
      return saved ? JSON.parse(saved) : DEFAULT_CHARACTERS;
    } catch {
      return DEFAULT_CHARACTERS;
    }
  });

  // 2. 두 팀 설정
  const [teams, setTeams] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEAMS);
      return saved ? JSON.parse(saved) : INITIAL_TEAMS;
    } catch {
      return INITIAL_TEAMS;
    }
  });

  // 3. 현재 활성화된 화면 (creator, roster, teambuilder, tactics, match)
  const [activeTab, setActiveTab] = useState('match');

  // 4. 캐릭터 생성/수정 모달 상태
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  // 로컬스토리지 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHARS, JSON.stringify(characters));
    } catch (e) {
      console.error(e);
    }
  }, [characters]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
    } catch (e) {
      console.error(e);
    }
  }, [teams]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MODE, gameMode);
    } catch (e) {
      console.error(e);
    }
  }, [gameMode]);

  // 모드 변경 핸들러 (6인제 <-> 9인제)
  const handleGameModeChange = (newMode) => {
    setGameMode(newMode);
    setTeams(prev => {
      const is9 = newMode === '9person';
      const startersA = is9
        ? (prev.teamA.starterIds9 || INITIAL_TEAMS.teamA.starterIds9)
        : (prev.teamA.starterIds6 || INITIAL_TEAMS.teamA.starterIds6);
      const startersB = is9
        ? (prev.teamB.starterIds9 || INITIAL_TEAMS.teamB.starterIds9)
        : (prev.teamB.starterIds6 || INITIAL_TEAMS.teamB.starterIds6);

      return {
        teamA: {
          ...prev.teamA,
          starterIds: [...startersA],
          substitutionsRemaining: is9 ? 9 : 6
        },
        teamB: {
          ...prev.teamB,
          starterIds: [...startersB],
          substitutionsRemaining: is9 ? 9 : 6
        }
      };
    });
  };

  const charMap = new Map(characters.map(c => [c.id, c]));

  // 캐릭터 저장 핸들러
  const handleSaveCharacter = (newChar) => {
    setCharacters(prev => {
      const exists = prev.some(c => c.id === newChar.id);
      if (exists) {
        return prev.map(c => (c.id === newChar.id ? newChar : c));
      } else {
        return [newChar, ...prev];
      }
    });

    // 새로 만든 선수를 벤치에 자동 등록
    if (!teams.teamA.starterIds.includes(newChar.id) && !teams.teamB.starterIds.includes(newChar.id)) {
      setTeams(prev => ({
        ...prev,
        teamA: {
          ...prev.teamA,
          benchIds: [...prev.teamA.benchIds, newChar.id]
        }
      }));
    }

    setIsCreatorOpen(false);
    setEditingCharacter(null);
  };

  const handleEditCharacter = (char) => {
    setEditingCharacter(char);
    setActiveTab('creator');
  };

  const handleDeleteCharacter = (charId) => {
    if (confirm('이 선수를 정말 삭제하시겠습니까?')) {
      setCharacters(prev => prev.filter(c => c.id !== charId));
      setTeams(prev => ({
        teamA: {
          ...prev.teamA,
          starterIds: prev.teamA.starterIds.filter(id => id !== charId),
          benchIds: prev.teamA.benchIds.filter(id => id !== charId)
        },
        teamB: {
          ...prev.teamB,
          starterIds: prev.teamB.starterIds.filter(id => id !== charId),
          benchIds: prev.teamB.benchIds.filter(id => id !== charId)
        }
      }));
    }
  };

  const handleUpdateTactics = (teamKey, newTactics) => {
    setTeams(prev => ({
      ...prev,
      [teamKey]: {
        ...prev[teamKey],
        tactics: newTactics
      }
    }));
  };

  return (
    <div className="min-h-screen bg-[#0c0d11] text-[#f1f3f5] font-sans pb-16">
      {/* 1. 상단 글로벌 네비게이션 & 하이큐 브랜딩 배너 */}
      <header className="sticky top-0 z-40 bg-[#121319]/95 backdrop-blur-md border-b-2 border-haikyu-orange shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* 로고 & 슬로건 */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('match')}>
            <div className="w-10 h-10 rounded-xl bg-haikyu-orange flex items-center justify-center font-black text-white text-xl haikyu-title shadow-haikyu transform -rotate-3">
              飛
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500 text-black px-1.5 py-0.2 rounded">
                  PAPS x HAIKYU SIMULATOR
                </span>
                {/* 6인제 / 9인제 헤더 뱃지 스위치 */}
                <div className="flex bg-[#08090b] rounded-lg p-0.5 border border-gray-700">
                  <button
                    onClick={() => handleGameModeChange('6person')}
                    className={`px-2 py-0.5 rounded text-[10px] font-black transition ${
                      gameMode === '6person'
                        ? 'bg-haikyu-orange text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    6인제
                  </button>
                  <button
                    onClick={() => handleGameModeChange('9person')}
                    className={`px-2 py-0.5 rounded text-[10px] font-black transition ${
                      gameMode === '9person'
                        ? 'bg-haikyu-yellow text-black shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    9인제
                  </button>
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl font-black haikyu-title text-white tracking-wider flex items-center gap-2">
                하이큐 배구 리그 ({gameMode === '9person' ? '9인제 학교스포츠클럽' : '6인제 FIVB'})
              </h1>
            </div>
          </div>

          {/* 메인 탭 내비게이션 버튼들 */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                setActiveTab('creator');
                setEditingCharacter(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition border ${
                activeTab === 'creator'
                  ? 'bg-haikyu-orange text-white border-haikyu-orange shadow-haikyu'
                  : 'bg-[#181a24] text-gray-300 border-gray-800 hover:border-gray-700'
              }`}
            >
              <Plus className="w-4 h-4" /> 캐릭터 생성
            </button>

            <button
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition border ${
                activeTab === 'roster'
                  ? 'bg-haikyu-orange text-white border-haikyu-orange shadow-haikyu'
                  : 'bg-[#181a24] text-gray-300 border-gray-800 hover:border-gray-700'
              }`}
            >
              <Users className="w-4 h-4" /> 선수 도감 ({characters.length})
            </button>

            <button
              onClick={() => setActiveTab('teambuilder')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition border ${
                activeTab === 'teambuilder'
                  ? 'bg-haikyu-orange text-white border-haikyu-orange shadow-haikyu'
                  : 'bg-[#181a24] text-gray-300 border-gray-800 hover:border-gray-700'
              }`}
            >
              <Shield className="w-4 h-4" /> 팀 편성 ({gameMode === '9person' ? '9인' : '6인'})
            </button>

            <button
              onClick={() => setActiveTab('tactics')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition border ${
                activeTab === 'tactics'
                  ? 'bg-haikyu-orange text-white border-haikyu-orange shadow-haikyu'
                  : 'bg-[#181a24] text-gray-300 border-gray-800 hover:border-gray-700'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" /> 전술 설정
            </button>

            <button
              onClick={() => setActiveTab('match')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition shadow-haikyu ${
                activeTab === 'match'
                  ? 'bg-haikyu-yellow text-black border-2 border-black'
                  : 'bg-haikyu-orange hover:bg-orange-600 text-white'
              }`}
            >
              <Play className="w-4 h-4 fill-current" /> 가상 경기장
            </button>
          </nav>
        </div>
      </header>

      {/* 2. 메인 컨텐츠 영역 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* TAB 1: 캐릭터 생성 */}
        {activeTab === 'creator' && (
          <CharacterCreator
            editingCharacter={editingCharacter}
            onSaveCharacter={(char) => {
              handleSaveCharacter(char);
              setActiveTab('roster');
            }}
            onCancel={() => setActiveTab('roster')}
          />
        )}

        {/* TAB 2: 전체 선수 도감 */}
        {activeTab === 'roster' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between bg-[#15171e] border-2 border-[#2b303e] rounded-2xl p-5 shadow-haikyu">
              <div>
                <span className="text-xs uppercase font-black bg-haikyu-orange text-black px-2 py-0.5 rounded tracking-wider mr-2">
                  ATHLETE DATABASE
                </span>
                <h2 className="text-2xl font-black haikyu-title text-white tracking-wide mt-1">
                  중학교 PAPS 배구 선수 도감
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  직접 만든 캐릭터와 기본 하이큐 오마주 선수들의 PAPS 체력 등급 및 배구 스탯을 확인하고 수정할 수 있습니다.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingCharacter(null);
                  setActiveTab('creator');
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-haikyu-orange hover:bg-orange-600 text-white font-black rounded-xl text-sm shadow-haikyu transition hover:scale-105 mt-2 sm:mt-0"
              >
                <Plus className="w-4 h-4" /> 새로운 캐릭터 만들기
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {characters.map(char => (
                <CharacterCard
                  key={char.id}
                  character={char}
                  showActions={true}
                  onEdit={handleEditCharacter}
                  onDelete={handleDeleteCharacter}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: 팀 편성 및 라인업 배분 (6인제 or 9인제) */}
        {activeTab === 'teambuilder' && (
          <TeamBuilder
            characters={characters}
            teams={teams}
            gameMode={gameMode}
            onChangeGameMode={handleGameModeChange}
            onUpdateTeams={setTeams}
            onGoToTactics={() => setActiveTab('tactics')}
            onOpenCreator={() => {
              setEditingCharacter(null);
              setActiveTab('creator');
            }}
          />
        )}

        {/* TAB 4: 감독 전술판 */}
        {activeTab === 'tactics' && (
          <TacticBoard
            teams={teams}
            onUpdateTactics={handleUpdateTactics}
            onStartMatch={() => setActiveTab('match')}
            onBackToRoster={() => setActiveTab('teambuilder')}
          />
        )}

        {/* TAB 5: 실시간 가상 경기장 (6인제 or 9인제) */}
        {activeTab === 'match' && (
          <MatchSimulation
            teams={teams}
            charMap={charMap}
            gameMode={gameMode}
            onChangeGameMode={handleGameModeChange}
            onModifyTactics={() => setActiveTab('tactics')}
            onResetToRoster={() => setActiveTab('teambuilder')}
          />
        )}
      </main>
    </div>
  );
}
