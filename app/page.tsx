'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GameSceneManager, CombatInfo } from '../src/engine/scene';
import { inputManager } from '../src/engine/input';
import { saveSystem, SolanderCreatureData, PlayerResources } from '../src/systems/save';
import { sound } from '../src/systems/audio';
import { ActivePrompt } from '../src/systems/interaction';
import { Sparkles, Heart, Compass, Volume2, VolumeX, BookOpen, ChevronRight, X, Footprints, Utensils, Zap, Shield, Flame, Gem, Sprout } from 'lucide-react';

const DEFAULT_RESOURCES: PlayerResources = {
  essence: 0,
  seeds: 0,
  crystals: 0,
  swimFruit: 0,
  flyFruit: 0,
  runFruit: 0,
  powerFruit: 0,
  staminaFruit: 0,
  heroFruit: 0,
  darkFruit: 0
};

export default function SolanderGamePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<GameSceneManager | null>(null);

  const [activePrompt, setActivePrompt] = useState<ActivePrompt | null>(null);
  const [fadeOpacity, setFadeOpacity] = useState<number>(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showPassport, setShowPassport] = useState<boolean>(false);
  const [showNurtureModal, setShowNurtureModal] = useState<boolean>(false);
  const [showRosterModal, setShowRosterModal] = useState<boolean>(false);
  const [isCarryingState, setIsCarryingState] = useState<boolean>(false);
  const [showKindergartenModal, setShowKindergartenModal] = useState<boolean>(false);
  const [showCompetitionModal, setShowCompetitionModal] = useState<boolean>(false);
  const [showWheelMenu, setShowWheelMenu] = useState<boolean>(false);
  const [inspectedChaoId, setInspectedChaoId] = useState<string | null>(null);
  const [showDestinationHubModal, setShowDestinationHubModal] = useState<boolean>(false);
  const [kindergartenTab, setKindergartenTab] = useState<'CLASSROOM' | 'DOCTOR' | 'TOYS' | 'BREEDING'>('CLASSROOM');

  // State for Contextual Companion Interaction & Combat HUD
  const [showCompanionModal, setShowCompanionModal] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [combatInfo, setCombatInfo] = useState<CombatInfo>({
    inCombat: false,
    comboCount: 0,
    enemyName: null,
    enemyHp: 3,
    enemyMaxHp: 3
  });

  // Keyboard shortcut listener for Menu Wheel (TAB / M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setShowWheelMenu(prev => !prev);
      } else if (e.key === 'Escape') {
        setShowWheelMenu(false);
        setShowCompanionModal(false);
        setShowStatsModal(false);
        setInspectedChaoId(null);
        setShowDestinationHubModal(false);
        setShowNurtureModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [competitionTab, setCompetitionTab] = useState<'RACE' | 'KARATE'>('RACE');
  const [raceProgress, setRaceProgress] = useState<number>(0);
  const [isRacing, setIsRacing] = useState<boolean>(false);
  const [karateProgress, setKarateProgress] = useState<number>(0);
  const [isKarateFighting, setIsKarateFighting] = useState<boolean>(false);

  const startGrandPrixRace = () => {
    if (isRacing || !companion) return;
    setIsRacing(true);
    setRaceProgress(0);
    sound.playChirp();

    let p = 0;
    const interval = setInterval(() => {
      const speed = (companion.runStat + companion.swimStat + companion.flyStat) / 20;
      p += 4 + speed + Math.random() * 5;
      if (p >= 100) {
        setRaceProgress(100);
        setIsRacing(false);
        clearInterval(interval);
        saveSystem.recordWin('RACE');
      } else {
        setRaceProgress(Math.min(99, Math.round(p)));
      }
    }, 250);
  };

  const startKarateSparring = () => {
    if (isKarateFighting || !companion) return;
    setIsKarateFighting(true);
    setKarateProgress(0);
    sound.playChirp();

    let p = 0;
    const interval = setInterval(() => {
      const power = (companion.powerStat + companion.staminaStat) / 15;
      p += 5 + power + Math.random() * 6;
      if (p >= 100) {
        setKarateProgress(100);
        setIsKarateFighting(false);
        clearInterval(interval);
        saveSystem.recordWin('KARATE');
      } else {
        setKarateProgress(Math.min(99, Math.round(p)));
      }
    }, 250);
  };

  const handleTriggerMelee = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.handlePlayerMeleeAttack();
    }
  };

  const handleTriggerLaser = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.handlePlayerLaserFire();
    }
  };

  const handleTriggerRoll = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.player.triggerRoll();
    }
  };

  const handleTriggerCarry = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.toggleCarryCompanion();
      setIsCarryingState(sceneManagerRef.current.player.isCarrying);
    }
  };

  const handleSelectCompanion = (id: string) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.selectCompanion(id);
      setCompanion(saveSystem.getCompanion());
    }
    setShowRosterModal(false);
    setInspectedChaoId(null);
  };

  // Companion & Save state
  const [companion, setCompanion] = useState<SolanderCreatureData | null>(null);
  const [resources, setResources] = useState<PlayerResources>(DEFAULT_RESOURCES);
  const [currentWorld, setCurrentWorld] = useState<'GARDEN' | 'MYSTIC_VALLEY'>('GARDEN');
  const [memories, setMemories] = useState<{ id: string; title: string; text: string; date: string }[]>([]);

  // Virtual Joystick touch state
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState<boolean>(false);
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current || sceneManagerRef.current) return;

    // Initialize Save System Listener
    const updateFromSave = () => {
      const state = saveSystem.getState();
      setCompanion(saveSystem.getCompanion());
      setResources(state.resources || DEFAULT_RESOURCES);
      setCurrentWorld(state.currentWorld);
      setMemories(state.discoveredMemories);
      if (state.activeMessage) {
        setMessage(state.activeMessage);
        const timer = setTimeout(() => {
          saveSystem.setMessage(null);
          setMessage(null);
        }, 4500);
        return () => clearTimeout(timer);
      }
    };

    updateFromSave();
    const unsubscribeSave = saveSystem.subscribe(updateFromSave);

    // Initialize 3D Scene Manager
    const manager = new GameSceneManager(
      containerRef.current,
      (prompt) => setActivePrompt(prompt),
      (opacity) => setFadeOpacity(opacity),
      (cState) => setCombatInfo(cState)
    );
    sceneManagerRef.current = manager;

    return () => {
      unsubscribeSave();
    };
  }, []);

  // Handle Touch Joystick Events
  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    setJoystickActive(true);
  };

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickActive || !joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const radius = rect.width / 2;

    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(radius, dist);
    const angle = Math.atan2(dy, dx);

    const x = (Math.cos(angle) * clampedDist) / radius;
    const y = (Math.sin(angle) * clampedDist) / radius;

    setJoystickPos({ x: x * 35, y: y * 35 });
    inputManager.setJoystickVector(x, y);
  };

  const handleJoystickEnd = () => {
    setJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    inputManager.setJoystickVector(0, 0);
  };

  const handleTriggerInteraction = () => {
    if (activePrompt && activePrompt.type === 'COMPANION') {
      setShowCompanionModal(true);
      sound.playChirp();
      return;
    }
    if (sceneManagerRef.current) {
      sceneManagerRef.current.handleInteractAction(
        () => setShowDestinationHubModal(true),
        (creatureId) => setInspectedChaoId(creatureId)
      );
    }
  };

  const handleTriggerJump = () => {
    inputManager.isJumpPressed = true;
  };

  const toggleAudio = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900 select-none font-sans">
      {/* 3D Canvas Host Container */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Screen Fade Transition Overlay */}
      <div
        className="absolute inset-0 z-50 bg-black pointer-events-none transition-opacity duration-300"
        style={{ opacity: fadeOpacity }}
      />

      {/* Game HUD Overlay Layer */}
      <div className="relative z-10 flex flex-col justify-between h-full p-4 pointer-events-none">
        {/* Top Minimal Exploration HUD Bar */}
        <div className="flex items-center justify-between gap-3 pointer-events-auto">
          {/* Left: World Pill & Radial Menu Button */}
          <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 rounded-full px-3 py-1.5 shadow-xl text-white">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              {currentWorld === 'GARDEN' ? '🏡 Solander Garden' : '⚔️ Mystic Valley'}
            </span>
            <div className="h-3 w-px bg-slate-800" />
            <button
              onClick={() => {
                setShowWheelMenu(prev => !prev);
                sound.playChirp();
              }}
              className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-[11px] py-1 px-3 rounded-full flex items-center gap-1.5 shadow-lg transition active:scale-95"
              title="Open Menu Wheel (Press TAB or M)"
            >
              <span>🎡</span>
              <span>MENU</span>
              <span className="bg-black/40 text-cyan-200 px-1 py-0.5 rounded font-mono text-[9px]">TAB</span>
            </button>
          </div>

          {/* Center: Essential Resources Bar */}
          <div className="flex items-center gap-3 bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-full px-4 py-1.5 shadow-xl text-white font-mono text-xs">
            <div className="flex items-center gap-1.5" title="Solander Essence">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-bold text-sky-200">{resources.essence}</span>
            </div>
            <div className="h-3 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5" title="Ancient Seeds">
              <Sprout className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-emerald-200">{resources.seeds}</span>
            </div>
            <div className="h-3 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5" title="Shimmering Crystals">
              <Gem className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-bold text-purple-200">{resources.crystals}</span>
            </div>
          </div>

          {/* Right: Companion Indicator Pill & Audio Toggle */}
          <div className="flex items-center gap-2">
            {companion && (
              <button
                onClick={() => {
                  setShowCompanionModal(true);
                  sound.playChirp();
                }}
                className="bg-slate-950/85 hover:bg-slate-900 backdrop-blur-md border border-sky-500/40 rounded-full px-3 py-1.5 shadow-xl text-white flex items-center gap-2 transition active:scale-95"
                title="Interact with Companion"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
                <span className="font-bold text-xs text-sky-200">{companion.name}</span>
                <div className="flex items-center gap-1 text-[11px] text-rose-300 font-mono">
                  <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                  <span>{companion.bond}%</span>
                </div>
              </button>
            )}

            <button
              onClick={toggleAudio}
              className="bg-slate-950/85 hover:bg-slate-900 text-slate-200 p-2 rounded-full border border-slate-700 shadow-lg transition"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
            </button>
          </div>
        </div>

        {/* Dynamic Combat HUD Banner (Fades in when in combat) */}
        {combatInfo.inCombat && (
          <div className="self-center bg-slate-950/90 border border-rose-500/60 backdrop-blur-md rounded-2xl p-3 px-6 shadow-2xl text-white flex flex-col items-center gap-1.5 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
            <div className="flex items-center justify-between gap-8 w-full text-xs font-mono">
              <span className="text-emerald-400 font-black flex items-center gap-1">
                🐆 NEELO: <span className="text-white">100 HP</span>
              </span>
              {combatInfo.enemyName && (
                <span className="text-rose-400 font-black flex items-center gap-1">
                  💀 {combatInfo.enemyName}: <span className="text-white">{combatInfo.enemyHp} / {combatInfo.enemyMaxHp} HP</span>
                </span>
              )}
            </div>

            {/* Enemy Health Bar */}
            {combatInfo.enemyName && (
              <div className="w-48 bg-slate-900 h-2 rounded-full overflow-hidden border border-rose-900">
                <div
                  className="bg-gradient-to-r from-rose-600 to-amber-500 h-full transition-all duration-200"
                  style={{ width: `${(combatInfo.enemyHp / combatInfo.enemyMaxHp) * 100}%` }}
                />
              </div>
            )}

            {/* Combo Counter Indicator */}
            {combatInfo.comboCount > 0 && (
              <div className="text-xs font-black text-amber-300 animate-bounce tracking-widest bg-amber-950/80 px-3 py-0.5 rounded-full border border-amber-400/50">
                COMBO ×{combatInfo.comboCount} {combatInfo.comboCount >= 4 ? 'FINISHER!' : ''}
              </div>
            )}
          </div>
        )}

        {/* Center Toast Message Banner */}
        {message && (
          <div className="self-center bg-slate-900/90 border border-sky-400/50 backdrop-blur-lg text-slate-100 px-5 py-3 rounded-2xl shadow-2xl max-w-md text-center text-sm font-semibold animate-bounce">
            {message}
          </div>
        )}

        {/* Context Proximity Prompt */}
        <div className="flex flex-col items-center gap-2 mx-auto pointer-events-auto my-auto">
          {activePrompt && (
            <button
              onClick={handleTriggerInteraction}
              className="bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-sm py-3 px-6 rounded-full shadow-2xl border-2 border-cyan-300 flex items-center gap-2 transform active:scale-95 transition-all animate-bounce"
            >
              <span>{activePrompt.actionText}</span>
              <span className="bg-white/20 text-white px-2 py-0.5 rounded-md text-xs font-mono font-extrabold">E</span>
            </button>
          )}
        </div>

        {/* Bottom Contextual Controls (Joystick & Action Buttons) */}
        <div className="flex items-end justify-between gap-4 pointer-events-auto pb-2 w-full">
          {/* Mobile Touch Virtual Analog Joystick */}
          <div
            ref={joystickRef}
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
            onMouseDown={handleJoystickStart}
            onMouseMove={handleJoystickMove}
            onMouseUp={handleJoystickEnd}
            className="relative w-24 h-24 sm:w-28 sm:h-28 bg-slate-950/80 border-2 border-purple-500/60 rounded-full flex items-center justify-center backdrop-blur-md shadow-2xl touch-none cursor-grab active:scale-95 transition-transform"
          >
            <div className="text-[9px] font-black text-purple-300/80 select-none tracking-widest">D-PAD</div>
            <div
              className="absolute w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-purple-600 to-cyan-400 border-2 border-white rounded-full shadow-lg transition-transform duration-75 flex items-center justify-center text-[10px] font-black text-white"
              style={{
                transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
              }}
            >
              🎮
            </div>
          </div>

          {/* Contextual Action Buttons (Combat or Contextual Interact) */}
          <div className="flex items-center gap-2">
            {/* Show Combat Buttons during combat or when attacking */}
            {combatInfo.inCombat ? (
              <div className="grid grid-cols-3 gap-1.5 bg-slate-950/90 border border-purple-500/40 backdrop-blur-md p-2 rounded-2xl shadow-2xl animate-in fade-in duration-200">
                <button
                  onClick={handleTriggerMelee}
                  className="bg-purple-600 hover:bg-purple-500 border-purple-300 text-white font-black text-xs p-2.5 rounded-xl border flex items-center justify-center gap-1 shadow-lg active:scale-90 transition"
                  title="4-Hit Melee Combo (Keyboard: J)"
                >
                  <span className="text-xs">🗡️</span>
                  <span className="font-bold text-[10px]">Melee</span>
                </button>

                <button
                  onClick={handleTriggerLaser}
                  className="bg-cyan-600 hover:bg-cyan-500 border-cyan-300 text-white font-black text-xs p-2.5 rounded-xl border flex items-center justify-center gap-1 shadow-lg active:scale-90 transition"
                  title="Laser Fire (Keyboard: K)"
                >
                  <span className="text-xs">🔫</span>
                  <span className="font-bold text-[10px]">Laser</span>
                </button>

                <button
                  onClick={handleTriggerRoll}
                  className="bg-rose-600 hover:bg-rose-500 border-rose-300 text-white font-black text-xs p-2.5 rounded-xl border flex items-center justify-center gap-1 shadow-lg active:scale-90 transition"
                  title="Roll (Keyboard: C)"
                >
                  <span className="text-xs">🌀</span>
                  <span className="font-bold text-[10px]">Roll</span>
                </button>
              </div>
            ) : activePrompt ? (
              <button
                onClick={handleTriggerInteraction}
                className="bg-emerald-500 hover:bg-emerald-400 border-emerald-300 text-slate-950 font-black text-xs py-3 px-5 rounded-2xl border flex items-center justify-center gap-1.5 shadow-2xl active:scale-90 transition"
              >
                <span className="w-5 h-5 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center font-mono text-[10px] font-bold">E</span>
                <span className="font-bold text-xs text-slate-950">Action</span>
              </button>
            ) : (
              <button
                onClick={handleTriggerJump}
                className="bg-emerald-500/90 hover:bg-emerald-400 border-emerald-300 text-slate-950 font-black text-xs py-2.5 px-4 rounded-2xl border flex items-center justify-center gap-1.5 shadow-xl active:scale-90 transition"
              >
                <span className="w-5 h-5 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center font-mono text-[10px] font-bold">A</span>
                <span className="font-bold text-xs text-slate-950">Jump</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contextual Companion Interaction Panel Modal */}
      {showCompanionModal && companion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-sky-400/60 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowCompanionModal(false)}
              className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-3xl">
                {companion.alignment === 'HERO' ? '😇' : companion.alignment === 'DARK' ? '😈' : '💖'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-100">{companion.name}</h2>
                  <span className="text-[10px] font-bold bg-sky-900/80 text-sky-200 px-2 py-0.5 rounded-full uppercase border border-sky-400/40">
                    {companion.form} FORM
                  </span>
                </div>
                <p className="text-xs text-sky-300 font-medium">Personality: {companion.personality} • Bond Level: {companion.bond}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 my-5">
              <button
                onClick={() => {
                  setShowCompanionModal(false);
                  setShowNurtureModal(true);
                  sound.playChirp();
                }}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold p-3 rounded-2xl border border-sky-400/50 flex flex-col items-center gap-1.5 shadow-lg active:scale-95 transition"
              >
                <Utensils className="w-5 h-5 text-sky-200" />
                <span className="text-xs">🍎 Nurture / Feed</span>
              </button>

              <button
                onClick={() => {
                  setShowCompanionModal(false);
                  setShowStatsModal(true);
                  sound.playChirp();
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold p-3 rounded-2xl border border-purple-400/50 flex flex-col items-center gap-1.5 shadow-lg active:scale-95 transition"
              >
                <Sparkles className="w-5 h-5 text-purple-200" />
                <span className="text-xs">📊 Inspect Stats</span>
              </button>

              <button
                onClick={handleTriggerCarry}
                className={`${isCarryingState ? 'bg-amber-500 border-amber-300' : 'bg-amber-600 border-amber-400'} hover:brightness-110 text-slate-950 font-black p-3 rounded-2xl border flex flex-col items-center gap-1.5 shadow-lg active:scale-95 transition`}
              >
                <span className="text-lg">🤲</span>
                <span className="text-xs">{isCarryingState ? 'Set Down' : 'Carry Companion'}</span>
              </button>

              <button
                onClick={() => {
                  saveSystem.increaseBond(5);
                  sound.playChirp();
                  saveSystem.setMessage(`❤️ You petted ${companion.name}! Bond increased to ${Math.min(100, companion.bond + 5)}%!`);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold p-3 rounded-2xl border border-rose-400/50 flex flex-col items-center gap-1.5 shadow-lg active:scale-95 transition"
              >
                <Heart className="w-5 h-5 text-rose-200 fill-rose-200" />
                <span className="text-xs">💖 Pet Companion</span>
              </button>
            </div>

            <button
              onClick={() => {
                setShowCompanionModal(false);
                setShowPassport(true);
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-2xl text-xs transition border border-slate-700 flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Discovered Memories & Passport</span>
            </button>
          </div>
        </div>
      )}

      {/* Companion Stats Inspection Modal */}
      {showStatsModal && companion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/60 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowStatsModal(false)}
              className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400 flex items-center justify-center text-purple-300 font-black text-2xl">
                📊
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-100">{companion.name} Evolution Stats</h2>
                <p className="text-xs text-purple-300 font-medium">Alignment: {companion.alignment} ({companion.alignmentScore > 0 ? `+${companion.alignmentScore}` : companion.alignmentScore})</p>
              </div>
            </div>

            <div className="my-5 space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-sky-300 mb-1">
                  <span>🌊 Swim Stat</span>
                  <span className="font-bold">{companion.swimStat} / 99</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-sky-900">
                  <div className="bg-sky-400 h-full transition-all duration-300" style={{ width: `${(companion.swimStat / 99) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-indigo-300 mb-1">
                  <span>🪽 Fly Stat</span>
                  <span className="font-bold">{companion.flyStat} / 99</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-indigo-900">
                  <div className="bg-indigo-400 h-full transition-all duration-300" style={{ width: `${(companion.flyStat / 99) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-emerald-300 mb-1">
                  <span>🏃 Run Stat</span>
                  <span className="font-bold">{companion.runStat} / 99</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-emerald-900">
                  <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${(companion.runStat / 99) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-rose-300 mb-1">
                  <span>💪 Power Stat</span>
                  <span className="font-bold">{companion.powerStat} / 99</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-rose-900">
                  <div className="bg-rose-400 h-full transition-all duration-300" style={{ width: `${(companion.powerStat / 99) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-amber-300 mb-1">
                  <span>⚡ Stamina Stat</span>
                  <span className="font-bold">{companion.staminaStat} / 99</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-amber-900">
                  <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${(companion.staminaStat / 99) * 100}%` }} />
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowStatsModal(false)}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-2xl text-xs transition"
            >
              Close Stats
            </button>
          </div>
        </div>
      )}

      {/* Chao Kindergarten Modal */}
      {showKindergartenModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/50 rounded-3xl p-6 max-w-xl w-full shadow-2xl text-white relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowKindergartenModal(false)}
              className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400 flex items-center justify-center text-purple-300 font-black text-2xl">
                🏫
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-100">Chao Kindergarten</h2>
                <p className="text-xs text-purple-300 font-medium">Classrooms, Doctor Check-up, Toy Room & Breeding Fortune Teller</p>
              </div>
            </div>

            {/* Sub-Tab Navigation */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl my-4 border border-slate-800">
              {(['CLASSROOM', 'DOCTOR', 'TOYS', 'BREEDING'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setKindergartenTab(tab)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${kindergartenTab === tab ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {tab === 'CLASSROOM' && '📚 Classroom'}
                  {tab === 'DOCTOR' && '🩺 Doctor'}
                  {tab === 'TOYS' && '🧸 Toys'}
                  {tab === 'BREEDING' && '💖 Breeding'}
                </button>
              ))}
            </div>

            {/* TAB 1: CLASSROOM */}
            {kindergartenTab === 'CLASSROOM' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">Enroll {companion?.name || 'your Chao'} in classroom lessons to master artistic and musical arts!</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 text-center">
                    <span className="text-2xl block mb-1">💃</span>
                    <h4 className="font-bold text-xs text-purple-300">Dancing</h4>
                    <p className="text-[10px] text-slate-400 mb-2">Level: {companion?.dancingSkill || 0}/100</p>
                    <button
                      onClick={() => saveSystem.trainClassroomSkill('dancing')}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-1.5 rounded-xl text-[11px]"
                    >
                      Train Dance
                    </button>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 text-center">
                    <span className="text-2xl block mb-1">🎶</span>
                    <h4 className="font-bold text-xs text-sky-300">Singing</h4>
                    <p className="text-[10px] text-slate-400 mb-2">Level: {companion?.singingSkill || 0}/100</p>
                    <button
                      onClick={() => saveSystem.trainClassroomSkill('singing')}
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-1.5 rounded-xl text-[11px]"
                    >
                      Train Song
                    </button>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 text-center">
                    <span className="text-2xl block mb-1">🎨</span>
                    <h4 className="font-bold text-xs text-amber-300">Drawing</h4>
                    <p className="text-[10px] text-slate-400 mb-2">Level: {companion?.drawingSkill || 0}/100</p>
                    <button
                      onClick={() => saveSystem.trainClassroomSkill('drawing')}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-1.5 rounded-xl text-[11px]"
                    >
                      Train Art
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DOCTOR CHECK-UP */}
            {kindergartenTab === 'DOCTOR' && companion && (
              <div className="space-y-3">
                <div className="bg-slate-800/90 p-4 rounded-2xl border border-sky-500/30">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700">
                    <span className="font-bold text-sm text-sky-300">{companion.name} Health & Evolution Report</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${companion.alignment === 'HERO' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : companion.alignment === 'DARK' ? 'bg-rose-900/40 text-rose-300 border border-rose-500/40' : 'bg-slate-700 text-slate-300'}`}>
                      {companion.alignment} ALIGNMENT ({companion.alignmentScore > 0 ? `+${companion.alignmentScore}` : companion.alignmentScore})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-slate-900/80 p-2 rounded-xl">🌊 Swim: <span className="text-sky-300 font-bold">{companion.swimStat}</span>/99</div>
                    <div className="bg-slate-900/80 p-2 rounded-xl">🪽 Fly: <span className="text-indigo-300 font-bold">{companion.flyStat}</span>/99</div>
                    <div className="bg-slate-900/80 p-2 rounded-xl">🏃 Run: <span className="text-emerald-300 font-bold">{companion.runStat}</span>/99</div>
                    <div className="bg-slate-900/80 p-2 rounded-xl">💪 Power: <span className="text-rose-300 font-bold">{companion.powerStat}</span>/99</div>
                  </div>
                  <div className="mt-2 bg-slate-900/80 p-2 rounded-xl text-xs font-mono">⚡ Stamina: <span className="text-amber-300 font-bold">{companion.staminaStat}</span>/99</div>
                </div>
              </div>
            )}

            {/* TAB 3: TOY ROOM */}
            {kindergartenTab === 'TOYS' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">Garden Toys active in the world:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 flex items-center gap-2">
                    <span className="text-2xl">🎹</span>
                    <div><h5 className="font-bold text-slate-200">Grand Piano</h5><p className="text-[10px] text-slate-400">Playable by Chao</p></div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 flex items-center gap-2">
                    <span className="text-2xl">🛝</span>
                    <div><h5 className="font-bold text-slate-200">Water Slide</h5><p className="text-[10px] text-slate-400">Lake splash slide</p></div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 flex items-center gap-2">
                    <span className="text-2xl">🏖️</span>
                    <div><h5 className="font-bold text-slate-200">Bouncy Ball</h5><p className="text-[10px] text-slate-400">Interactive toy</p></div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 flex items-center gap-2">
                    <span className="text-2xl">🛏️</span>
                    <div><h5 className="font-bold text-slate-200">Nap Hammock</h5><p className="text-[10px] text-slate-400">Resting hammock</p></div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: BREEDING FORTUNE TELLER */}
            {kindergartenTab === 'BREEDING' && (
              <div className="space-y-3 text-center">
                <p className="text-xs text-slate-300">The Breeding Fortune Teller combines genetics of two garden creatures to hatch a new generation!</p>
                {saveSystem.getAllCreatures().length >= 2 ? (
                  <button
                    onClick={() => {
                      const list = saveSystem.getAllCreatures();
                      saveSystem.breedChao(list[0].id, list[1].id);
                    }}
                    className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black py-3 rounded-2xl text-xs shadow-lg transition"
                  >
                    💖 Breed {saveSystem.getAllCreatures()[0].name} & {saveSystem.getAllCreatures()[1].name}
                  </button>
                ) : (
                  <p className="text-xs text-amber-400">Need at least 2 hatched Chao in the garden to breed.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grand Prix & Karate Arenas Modal */}
      {showCompetitionModal && companion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-xl w-full shadow-2xl text-white relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowCompetitionModal(false)}
              className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 font-black text-2xl">
                🏆
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-100">Solander Competitions</h2>
                <p className="text-xs text-amber-300 font-medium">Grand Prix Obstacle Races & Chao Karate Sparring</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl my-4 border border-slate-800">
              <button
                onClick={() => setCompetitionTab('RACE')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${competitionTab === 'RACE' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                🏁 Solander Grand Prix
              </button>
              <button
                onClick={() => setCompetitionTab('KARATE')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${competitionTab === 'KARATE' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                🥋 Chao Karate Arena
              </button>
            </div>

            {/* RACE TAB */}
            {competitionTab === 'RACE' && (
              <div className="space-y-4">
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                  <h4 className="font-bold text-sm text-amber-300 mb-1">Obstacle Course: Swim, Sprint, Mountain Fly</h4>
                  <p className="text-xs text-slate-300 mb-3">Stats determine speed & stamina!</p>

                  <div className="w-full bg-slate-950 h-4 rounded-full overflow-hidden border border-slate-800 mb-3">
                    <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-300" style={{ width: `${raceProgress}%` }} />
                  </div>

                  <button
                    onClick={startGrandPrixRace}
                    disabled={isRacing}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs transition shadow"
                  >
                    {isRacing ? `Racing... (${raceProgress}%)` : '🏁 Enter Grand Prix Race'}
                  </button>
                </div>
              </div>
            )}

            {/* KARATE TAB */}
            {competitionTab === 'KARATE' && (
              <div className="space-y-4">
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                  <h4 className="font-bold text-sm text-rose-300 mb-1">Chao Karate Sparring Battle</h4>
                  <p className="text-xs text-slate-300 mb-3">Power & Stamina unleash martial strike zeal!</p>

                  <div className="w-full bg-slate-950 h-4 rounded-full overflow-hidden border border-slate-800 mb-3">
                    <div className="bg-gradient-to-r from-rose-500 to-purple-400 h-full transition-all duration-300" style={{ width: `${karateProgress}%` }} />
                  </div>

                  <button
                    onClick={startKarateSparring}
                    disabled={isKarateFighting}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-2.5 rounded-xl text-xs transition shadow"
                  >
                    {isKarateFighting ? `Sparring... (${karateProgress}%)` : '🥋 Enter Karate Tournament'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Companion Nurture & Evolution Modal */}
      {showNurtureModal && companion && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-sky-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowNurtureModal(false)}
              className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-300 font-black text-xl">
                ✨
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Nurture {companion.name}</h2>
                <p className="text-xs text-sky-400 font-medium">
                  Current Form: <span className="uppercase text-amber-300 font-bold">{companion.form === 'DEFAULT' ? 'Base Form' : `${companion.form} Form`}</span>
                </p>
              </div>
            </div>

            {/* Companion Stats Bars */}
            <div className="my-4 space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-400" /> Curiosity</span>
                  <span className="font-mono text-amber-300">{companion.curiosity}/100</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${companion.curiosity}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-indigo-400" /> Bravery</span>
                  <span className="font-mono text-indigo-300">{companion.bravery}/100</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${companion.bravery}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-sky-400" /> Energy</span>
                  <span className="font-mono text-sky-300">{companion.energy}/100</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-400 h-full transition-all duration-300" style={{ width: `${companion.energy}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-rose-400" /> Creativity</span>
                  <span className="font-mono text-rose-300">{companion.creativity}/100</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-400 h-full transition-all duration-300" style={{ width: `${companion.creativity}%` }} />
                </div>
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5 text-sky-400" />
              Elemental Fruits & Alignment Treats
            </h3>

            {/* Specialized Elemental Fruits */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              <button
                onClick={() => { if (saveSystem.feedFruit('swimFruit')) sound.playChirp(); }}
                disabled={(resources.swimFruit || 0) <= 0}
                className="bg-sky-950/80 hover:bg-sky-900 disabled:opacity-30 border border-sky-500/40 p-1.5 rounded-xl text-center transition"
              >
                <span className="text-base block">🌊</span>
                <span className="text-[9px] font-bold text-sky-300 block">Swim (+4)</span>
                <span className="text-[9px] text-slate-400">({resources.swimFruit || 0})</span>
              </button>

              <button
                onClick={() => { if (saveSystem.feedFruit('flyFruit')) sound.playChirp(); }}
                disabled={(resources.flyFruit || 0) <= 0}
                className="bg-indigo-950/80 hover:bg-indigo-900 disabled:opacity-30 border border-indigo-500/40 p-1.5 rounded-xl text-center transition"
              >
                <span className="text-base block">🪽</span>
                <span className="text-[9px] font-bold text-indigo-300 block">Fly (+4)</span>
                <span className="text-[9px] text-slate-400">({resources.flyFruit || 0})</span>
              </button>

              <button
                onClick={() => { if (saveSystem.feedFruit('runFruit')) sound.playChirp(); }}
                disabled={(resources.runFruit || 0) <= 0}
                className="bg-emerald-950/80 hover:bg-emerald-900 disabled:opacity-30 border border-emerald-500/40 p-1.5 rounded-xl text-center transition"
              >
                <span className="text-base block">🏃</span>
                <span className="text-[9px] font-bold text-emerald-300 block">Run (+4)</span>
                <span className="text-[9px] text-slate-400">({resources.runFruit || 0})</span>
              </button>

              <button
                onClick={() => { if (saveSystem.feedFruit('powerFruit')) sound.playChirp(); }}
                disabled={(resources.powerFruit || 0) <= 0}
                className="bg-rose-950/80 hover:bg-rose-900 disabled:opacity-30 border border-rose-500/40 p-1.5 rounded-xl text-center transition"
              >
                <span className="text-base block">💪</span>
                <span className="text-[9px] font-bold text-rose-300 block">Power (+4)</span>
                <span className="text-[9px] text-slate-400">({resources.powerFruit || 0})</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => { if (saveSystem.feedFruit('staminaFruit')) sound.playChirp(); }}
                disabled={(resources.staminaFruit || 0) <= 0}
                className="bg-amber-950/80 hover:bg-amber-900 disabled:opacity-30 border border-amber-500/40 p-1.5 rounded-xl text-center transition"
              >
                <span className="text-base block">⚡</span>
                <span className="text-[9px] font-bold text-amber-300 block">Stamina (+4)</span>
                <span className="text-[9px] text-slate-400">({resources.staminaFruit || 0})</span>
              </button>

              <button
                onClick={() => { if (saveSystem.feedFruit('heroFruit')) sound.playChirp(); }}
                disabled={(resources.heroFruit || 0) <= 0}
                className="bg-amber-900/60 hover:bg-amber-800 border border-amber-400/60 p-1.5 rounded-xl text-center transition"
              >
                <span className="text-base block">😇</span>
                <span className="text-[9px] font-bold text-amber-200 block">Hero Treat</span>
                <span className="text-[9px] text-slate-400">({resources.heroFruit || 0})</span>
              </button>

              <button
                onClick={() => { if (saveSystem.feedFruit('darkFruit')) sound.playChirp(); }}
                disabled={(resources.darkFruit || 0) <= 0}
                className="bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 p-1.5 rounded-xl text-center transition"
              >
                <span className="text-base block">😈</span>
                <span className="text-[9px] font-bold text-rose-300 block">Dark Treat</span>
                <span className="text-[9px] text-slate-400">({resources.darkFruit || 0})</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-3 italic">
              *Feeding Crystals and Seeds increases Bravery & Curiosity to trigger Solander Evolutions!
            </p>

            <button
              onClick={() => setShowNurtureModal(false)}
              className="mt-4 w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              Done Nurturing
            </button>
          </div>
        </div>
      )}

      {/* Companion Passport & Memories Modal */}
      {showPassport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-sky-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowPassport(false)}
              className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-300 font-black text-xl">
                S
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">{companion?.name || 'Solander'} Passport</h2>
                <p className="text-xs text-sky-400 font-medium">Origin: {companion?.originWorld}</p>
              </div>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Species</span>
                <span className="font-semibold text-sky-300">{companion?.species}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Happiness</span>
                <span className="font-semibold text-emerald-400">{companion?.happiness}%</span>
              </div>
              <div className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Curiosity</span>
                <span className="font-semibold text-amber-400">{companion?.curiosity}%</span>
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              Discovered Memories
            </h3>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {memories.map((m) => (
                <div key={m.id} className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-sky-300">{m.title}</span>
                    <span className="text-[10px] text-slate-500">{m.date}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowPassport(false)}
              className="mt-5 w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              Resume Journey
            </button>
          </div>
        </div>
      )}

      {/* Choose Follower Companion Roster Modal */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-sky-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowRosterModal(false)}
              className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-300 font-black text-xl">
                🌟
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Select Companion Follower</h2>
                <p className="text-xs text-sky-400 font-medium">Choose which Chao travels with you on adventures</p>
              </div>
            </div>

            <div className="my-4 max-h-60 overflow-y-auto space-y-2.5 pr-1">
              {saveSystem.getAllCreatures().map((c) => {
                const isSelected = companion?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCompanion(c.id)}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${isSelected ? 'bg-sky-950/80 border-sky-400 shadow-md' : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700/80'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/30 border border-sky-300 flex items-center justify-center font-bold text-sky-200 text-sm">
                        {c.name[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">{c.name}</h4>
                        <p className="text-[11px] text-slate-400">Personality: {c.personality} • Form: {c.form}</p>
                      </div>
                    </div>

                    <button
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${isSelected ? 'bg-sky-500 text-white border-sky-300' : 'bg-slate-700 text-slate-300 border-slate-600'}`}
                    >
                      {isSelected ? 'Active ✨' : 'Select'}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowRosterModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 1. RADIAL MENU WHEEL OVERLAY */}
      {showWheelMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200"
          onClick={() => setShowWheelMenu(false)}
        >
          <div
            className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full border-4 border-cyan-400/60 bg-slate-900/90 shadow-2xl flex items-center justify-center p-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Center Hub Badge */}
            <div className="absolute z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 border-2 border-cyan-300 flex flex-col items-center justify-center text-center shadow-xl">
              <span className="text-2xl">⚙️</span>
              <span className="text-[11px] font-black uppercase text-cyan-100 tracking-wider">SOLANDER</span>
              <span className="text-[9px] text-cyan-200 font-bold">WHEEL MENU</span>
            </div>

            {/* Close Wheel Button */}
            <button
              onClick={() => setShowWheelMenu(false)}
              className="absolute top-2 right-2 z-20 bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-full border border-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Radial Items Grid */}
            <div className="absolute inset-0 p-4">
              {/* 1. TOP: Fruits & Feeding */}
              <button
                onClick={() => { setShowWheelMenu(false); setShowNurtureModal(true); sound.playChirp(); }}
                className="absolute top-3 left-1/2 -translate-x-1/2 bg-sky-900/90 hover:bg-sky-700 border border-sky-400/80 px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-black shadow-lg hover:scale-105 transition"
              >
                <span>🎒</span>
                <span>Treats & Fruits</span>
              </button>

              {/* 2. TOP RIGHT: Chao Kindergarten */}
              <button
                onClick={() => { setShowWheelMenu(false); setShowKindergartenModal(true); sound.playChirp(); }}
                className="absolute top-1/4 right-3 bg-purple-900/90 hover:bg-purple-700 border border-purple-400/80 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs font-black shadow-lg hover:scale-105 transition"
              >
                <span>🏫</span>
                <span>Kindergarten</span>
              </button>

              {/* 3. BOTTOM RIGHT: Grand Prix & Karate */}
              <button
                onClick={() => { setShowWheelMenu(false); setShowCompetitionModal(true); sound.playChirp(); }}
                className="absolute bottom-1/4 right-3 bg-amber-900/90 hover:bg-amber-700 border border-amber-400/80 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs font-black shadow-lg hover:scale-105 transition"
              >
                <span>🏆</span>
                <span>Grand Prix</span>
              </button>

              {/* 4. BOTTOM: Chao Garden Roster */}
              <button
                onClick={() => { setShowWheelMenu(false); setShowRosterModal(true); sound.playChirp(); }}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-emerald-900/90 hover:bg-emerald-700 border border-emerald-400/80 px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-black shadow-lg hover:scale-105 transition"
              >
                <span>🐾</span>
                <span>Chao Roster</span>
              </button>

              {/* 5. BOTTOM LEFT: Memories & Quests */}
              <button
                onClick={() => { setShowWheelMenu(false); setShowPassport(true); sound.playChirp(); }}
                className="absolute bottom-1/4 left-3 bg-indigo-900/90 hover:bg-indigo-700 border border-indigo-400/80 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs font-black shadow-lg hover:scale-105 transition"
              >
                <span>📜</span>
                <span>Quests & Log</span>
              </button>

              {/* 6. TOP LEFT: Weather Cycle */}
              <button
                onClick={() => {
                  const state = saveSystem.getState();
                  const nextWeather = state.weather === 'SUNNY' ? 'RAIN' : state.weather === 'RAIN' ? 'BLOSSOMS' : 'SUNNY';
                  saveSystem.setWeather(nextWeather);
                  sound.playChirp();
                }}
                className="absolute top-1/4 left-3 bg-rose-900/90 hover:bg-rose-700 border border-rose-400/80 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs font-black shadow-lg hover:scale-105 transition"
              >
                <span>🌸</span>
                <span>Weather</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CHAO STATS INSPECTOR MODAL */}
      {inspectedChaoId && (() => {
        const c = saveSystem.getAllCreatures().find(x => x.id === inspectedChaoId) || companion;
        if (!c) return null;
        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-sky-400/60 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-white relative animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => setInspectedChaoId(null)}
                className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-3xl">
                  {c.alignment === 'HERO' ? '😇' : c.alignment === 'DARK' ? '😈' : '🐣'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-100">{c.name}</h2>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${c.alignment === 'HERO' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : c.alignment === 'DARK' ? 'bg-rose-900/40 text-rose-300 border border-rose-500/40' : 'bg-slate-700 text-slate-300'}`}>
                      {c.alignment} ALIGNMENT ({c.alignmentScore > 0 ? `+${c.alignmentScore}` : c.alignmentScore})
                    </span>
                  </div>
                  <p className="text-xs text-sky-300 font-medium">{c.species} • Personality: {c.personality} • Bond: {c.bond}%</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="my-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evolution Stats</h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-950 p-2.5 rounded-2xl border border-sky-500/30">🌊 Swim: <span className="text-sky-300 font-bold">{c.swimStat}</span>/99</div>
                  <div className="bg-slate-950 p-2.5 rounded-2xl border border-indigo-500/30">🪽 Fly: <span className="text-indigo-300 font-bold">{c.flyStat}</span>/99</div>
                  <div className="bg-slate-950 p-2.5 rounded-2xl border border-emerald-500/30">🏃 Run: <span className="text-emerald-300 font-bold">{c.runStat}</span>/99</div>
                  <div className="bg-slate-950 p-2.5 rounded-2xl border border-rose-500/30">💪 Power: <span className="text-rose-300 font-bold">{c.powerStat}</span>/99</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-2xl border border-amber-500/30 text-xs font-mono">⚡ Stamina: <span className="text-amber-300 font-bold">{c.staminaStat}</span>/99</div>

                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">Classroom Arts & Achievements</h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-800 p-2 rounded-xl">💃 Dance: <span className="text-purple-300 font-bold">{c.dancingSkill || 0}</span>/100</div>
                  <div className="bg-slate-800 p-2 rounded-xl">🎶 Song: <span className="text-sky-300 font-bold">{c.singingSkill || 0}</span>/100</div>
                  <div className="bg-slate-800 p-2 rounded-xl">🎨 Art: <span className="text-amber-300 font-bold">{c.drawingSkill || 0}</span>/100</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-amber-500/30 flex justify-between items-center text-xs font-bold">
                  <span>🏆 Grand Prix Trophies: {c.raceTrophies || 0}</span>
                  <span>🥋 Karate Belts: {c.karateBelts || 0}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { setInspectedChaoId(null); setShowNurtureModal(true); }}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  🍎 Feed Treats
                </button>
                <button
                  onClick={() => {
                    saveSystem.increaseBond(5);
                    sound.playChirp();
                    saveSystem.setMessage(`❤️ You petted ${c.name}! Happiness increased!`);
                  }}
                  className="bg-pink-600 hover:bg-pink-500 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  ❤️ Pet Chao
                </button>
                <button
                  onClick={() => {
                    saveSystem.setCompanion(c.id);
                    setCompanion(saveSystem.getCompanion());
                    setInspectedChaoId(null);
                  }}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  🌟 Set Active
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. WATERFALL CAVE DESTINATION HUB MODAL */}
      {showDestinationHubModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-400/60 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowDestinationHubModal(false)}
              className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-2xl">
                🌌
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-100">Solander Cave Hub</h2>
                <p className="text-xs text-cyan-300">Choose your destination in Solander Realm</p>
              </div>
            </div>

            <div className="space-y-2.5 my-4">
              <button
                onClick={() => { setShowDestinationHubModal(false); setShowCompetitionModal(true); sound.playChirp(); }}
                className="w-full bg-amber-900/80 hover:bg-amber-800 border border-amber-500/50 p-3 rounded-2xl flex items-center justify-between text-left transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <h4 className="font-bold text-sm text-amber-200">Grand Prix & Chao Karate</h4>
                    <p className="text-[11px] text-amber-300/80">Obstacle races & martial tournament</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-400" />
              </button>

              <button
                onClick={() => { setShowDestinationHubModal(false); setShowKindergartenModal(true); sound.playChirp(); }}
                className="w-full bg-purple-900/80 hover:bg-purple-800 border border-purple-500/50 p-3 rounded-2xl flex items-center justify-between text-left transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏫</span>
                  <div>
                    <h4 className="font-bold text-sm text-purple-200">Chao Kindergarten</h4>
                    <p className="text-[11px] text-purple-300/80">Lessons, Doctor, Toys & Breeding Fortune Teller</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400" />
              </button>

              <button
                onClick={() => { setShowDestinationHubModal(false); setShowNurtureModal(true); sound.playChirp(); }}
                className="w-full bg-sky-900/80 hover:bg-sky-800 border border-sky-500/50 p-3 rounded-2xl flex items-center justify-between text-left transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍎</span>
                  <div>
                    <h4 className="font-bold text-sm text-sky-200">Fruit Nursery & Treat Shop</h4>
                    <p className="text-[11px] text-sky-300/80">Elemental fruits & Hero/Dark treats</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-sky-400" />
              </button>

              <button
                onClick={() => {
                  setShowDestinationHubModal(false);
                  if (sceneManagerRef.current) {
                    sceneManagerRef.current.switchWorld(currentWorld === 'GARDEN' ? 'MYSTIC_VALLEY' : 'GARDEN');
                  }
                  sound.playTeleport();
                }}
                className="w-full bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-500/50 p-3 rounded-2xl flex items-center justify-between text-left transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌄</span>
                  <div>
                    <h4 className="font-bold text-sm text-emerald-200">{currentWorld === 'GARDEN' ? 'Travel to Mystic Valley' : 'Return to Solander Garden'}</h4>
                    <p className="text-[11px] text-emerald-300/80">Warp directly to the ancient valley</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
