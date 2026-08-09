'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GameSceneManager } from '../src/engine/scene';
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
  const [kindergartenTab, setKindergartenTab] = useState<'CLASSROOM' | 'DOCTOR' | 'TOYS' | 'BREEDING'>('CLASSROOM');
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

  const handleTriggerAttack = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.handlePlayerAttack();
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
      (opacity) => setFadeOpacity(opacity)
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
    if (sceneManagerRef.current) {
      sceneManagerRef.current.handleInteractAction();
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
        {/* Top Header & Companion Info Bar */}
        <div className="flex flex-wrap items-start justify-between gap-3 pointer-events-auto">
          {/* Brand & World Info with Neelo Hero Avatar Badge */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-purple-500/50 rounded-2xl p-3 px-4 shadow-2xl text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-950 border-2 border-purple-400/80 flex items-center justify-center text-xl shadow-lg relative overflow-hidden">
              <span className="text-2xl">🐆</span>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border border-slate-900" title="Neelo Hero Active" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm tracking-wide bg-gradient-to-r from-amber-300 via-purple-300 to-cyan-400 bg-clip-text text-transparent uppercase">
                  NEELO HERO
                </h1>
                <span className="text-[9px] font-extrabold bg-purple-900/90 text-purple-200 border border-purple-400/40 px-1.5 py-0.5 rounded-md font-mono">
                  SOLANDER
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-300 font-medium">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentWorld === 'GARDEN' ? '🏡 Solander Garden' : '⚔️ Mystic Valley'}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <button
                  onClick={() => {
                    if (sceneManagerRef.current && currentWorld !== 'GARDEN') {
                      sceneManagerRef.current.switchWorld('GARDEN');
                    }
                  }}
                  className={`text-[10px] font-bold py-0.5 px-2 rounded-lg border transition ${currentWorld === 'GARDEN' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                >
                  🏡 Garden
                </button>
                <button
                  onClick={() => {
                    if (sceneManagerRef.current && currentWorld !== 'MYSTIC_VALLEY') {
                      sceneManagerRef.current.switchWorld('MYSTIC_VALLEY');
                    }
                  }}
                  className={`text-[10px] font-bold py-0.5 px-2 rounded-lg border transition ${currentWorld === 'MYSTIC_VALLEY' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                >
                  ⚔️ Valley
                </button>
              </div>
            </div>
          </div>

          {/* Resources HUD Bar */}
          <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-xl text-white font-mono text-xs">
            <div className="flex items-center gap-1.5" title="Solander Essence">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-sky-200">{resources.essence}</span>
              <span className="text-[10px] text-slate-400">Essence</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5" title="Ancient Seeds">
              <Sprout className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-emerald-200">{resources.seeds}</span>
              <span className="text-[10px] text-slate-400">Seeds</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5" title="Shimmering Crystals">
              <Gem className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-purple-200">{resources.crystals}</span>
              <span className="text-[10px] text-slate-400">Crystals</span>
            </div>
          </div>

          {/* Companion Info Card */}
          {companion && (
            <div className="bg-slate-900/85 backdrop-blur-md border border-sky-500/40 rounded-2xl p-3 px-4 shadow-xl text-white w-72">
              <div className="flex justify-between items-center pb-2 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-sky-400 animate-ping" />
                  <span className="font-bold text-sm text-sky-300">{companion.name}</span>
                </div>
                <span className="text-[10px] bg-sky-600/60 text-sky-200 px-2 py-0.5 rounded-full font-mono uppercase">
                  {companion.form !== 'DEFAULT' ? companion.form : 'COMPANION'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400 text-[11px]">Personality:</span>
                  <p className="font-semibold text-slate-200">{companion.personality}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Bond Level:</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                    <span className="font-bold text-rose-300">{companion.bond}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => setShowNurtureModal(true)}
                  className="bg-sky-600/80 hover:bg-sky-500 text-white text-xs py-1.5 px-2.5 rounded-xl border border-sky-400/40 flex items-center justify-center gap-1 font-semibold transition shadow-md"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  Nurture / Feed
                </button>
                <button
                  onClick={() => setShowPassport(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-1.5 px-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-1 font-semibold transition"
                >
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                  Memories
                </button>
              </div>
            </div>
          )}

          {/* Top Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Chao Kindergarten Launcher */}
            <button
              onClick={() => setShowKindergartenModal(true)}
              className="bg-purple-900/90 hover:bg-purple-800 border border-purple-400/80 text-purple-100 px-3 py-2 rounded-2xl flex items-center gap-2 shadow-xl text-xs font-black transition"
            >
              <span className="text-base">🏫</span>
              <span>Kindergarten</span>
            </button>

            {/* Chao Grand Prix & Karate Arenas Launcher */}
            <button
              onClick={() => setShowCompetitionModal(true)}
              className="bg-amber-900/90 hover:bg-amber-800 border border-amber-400/80 text-amber-100 px-3 py-2 rounded-2xl flex items-center gap-2 shadow-xl text-xs font-black transition"
            >
              <span className="text-base">🏆</span>
              <span>Grand Prix & Karate</span>
            </button>

            {/* Weather Selector */}
            <div className="bg-slate-900/90 border border-slate-700 p-1 rounded-2xl flex items-center gap-1 shadow-xl">
              <button
                onClick={() => saveSystem.setWeather('SUNNY')}
                className={`px-2 py-1 rounded-xl text-xs font-bold transition ${saveSystem.getState().weather === 'SUNNY' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                title="Sunny Weather"
              >
                ☀️
              </button>
              <button
                onClick={() => saveSystem.setWeather('RAIN')}
                className={`px-2 py-1 rounded-xl text-xs font-bold transition ${saveSystem.getState().weather === 'RAIN' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                title="Rain Weather"
              >
                🌧️
              </button>
              <button
                onClick={() => saveSystem.setWeather('BLOSSOMS')}
                className={`px-2 py-1 rounded-xl text-xs font-bold transition ${saveSystem.getState().weather === 'BLOSSOMS' ? 'bg-pink-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                title="Blossoms Weather"
              >
                🌸
              </button>
            </div>

            <button
              onClick={toggleAudio}
              className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 p-2.5 rounded-2xl border border-slate-700 shadow-lg transition"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-sky-400" />}
            </button>
          </div>
        </div>

        {/* Center Toast Message Banner */}
        {message && (
          <div className="self-center bg-slate-900/90 border border-sky-400/50 backdrop-blur-lg text-slate-100 px-5 py-3 rounded-2xl shadow-2xl max-w-md text-center text-sm font-semibold animate-bounce">
            {message}
          </div>
        )}

        {/* Bottom Interactive Console Controller HUD */}
        <div className="flex flex-wrap items-end justify-between gap-4 pointer-events-auto pb-2 w-full">
          {/* Mobile Touch / Virtual Analog Joystick Pad */}
          <div className="flex items-center gap-3">
            <div
              ref={joystickRef}
              onTouchStart={handleJoystickStart}
              onTouchMove={handleJoystickMove}
              onTouchEnd={handleJoystickEnd}
              onMouseDown={handleJoystickStart}
              onMouseMove={handleJoystickMove}
              onMouseUp={handleJoystickEnd}
              className="relative w-28 h-28 bg-slate-900/80 border-2 border-purple-500/60 rounded-full flex items-center justify-center backdrop-blur-md shadow-2xl touch-none cursor-grab active:scale-95 transition-transform"
            >
              <div className="text-[10px] font-black text-purple-300/80 select-none tracking-widest">D-PAD</div>
              <div
                className="absolute w-12 h-12 bg-gradient-to-tr from-purple-600 to-cyan-400 border-2 border-white rounded-full shadow-lg transition-transform duration-75 flex items-center justify-center text-[10px] font-black text-white"
                style={{
                  transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
                }}
              >
                🎮
              </div>
            </div>

            {/* Keyboard & Gamepad Control Helper Strip */}
            <div className="hidden lg:flex flex-col bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2.5 px-3.5 shadow-xl text-slate-300 text-[11px] font-mono space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-purple-900 text-purple-200 border border-purple-500/50 px-1.5 py-0.5 rounded font-bold">WASD / ARROWS</span>
                <span>Move Neelo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-900 text-emerald-200 border border-emerald-500/50 px-1.5 py-0.5 rounded font-bold">SPACE</span>
                <span>Jump / Hop</span>
                <span className="bg-rose-900 text-rose-200 border border-rose-500/50 px-1.5 py-0.5 rounded font-bold">SHIFT / J</span>
                <span>Spin Attack</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-900 text-amber-200 border border-amber-500/50 px-1.5 py-0.5 rounded font-bold">E / C</span>
                <span>Interact / Carry Chao</span>
              </div>
            </div>
          </div>

          {/* Context Proximity Prompt & Active Action */}
          <div className="flex flex-col items-center gap-2 mx-auto">
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

          {/* Arcade Console Action Pad (A, B, X, Y Console Buttons) */}
          <div className="flex items-center gap-2">
            {/* Select Companion Roster */}
            <button
              onClick={() => setShowRosterModal(true)}
              className="bg-slate-900/90 hover:bg-slate-800 text-purple-300 font-extrabold text-xs py-3 px-3.5 rounded-2xl border border-purple-500/50 flex flex-col items-center gap-1 shadow-xl active:scale-95 transition"
              title="Choose Active Companion"
            >
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-[10px] uppercase font-mono">Chao</span>
            </button>

            {/* Arcade Action Buttons Cluster */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900/90 border border-purple-500/40 backdrop-blur-md p-2 rounded-2xl shadow-2xl">
              {/* (Y Button) Carry Chao */}
              <button
                onClick={handleTriggerCarry}
                className={`${isCarryingState ? 'bg-amber-500 border-amber-300' : 'bg-amber-600 border-amber-400'} hover:brightness-110 text-slate-950 font-black text-xs p-2.5 rounded-xl border flex items-center justify-center gap-1 shadow-lg active:scale-90 transition`}
                title="Carry or Set Down Chao (Keyboard: C / Gamepad Y)"
              >
                <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center font-mono text-[10px] font-bold">Y</span>
                <span className="hidden sm:inline font-bold text-[11px] text-slate-950">{isCarryingState ? 'Drop' : 'Carry'}</span>
              </button>

              {/* (X Button) Interact */}
              <button
                onClick={handleTriggerInteraction}
                className="bg-sky-500 hover:bg-sky-400 border-sky-300 text-slate-950 font-black text-xs p-2.5 rounded-xl border flex items-center justify-center gap-1 shadow-lg active:scale-90 transition"
                title="Interact / Action (Keyboard: E / Gamepad X)"
              >
                <span className="w-5 h-5 rounded-full bg-slate-950 text-sky-400 flex items-center justify-center font-mono text-[10px] font-bold">X</span>
                <span className="hidden sm:inline font-bold text-[11px] text-slate-950">Action</span>
              </button>

              {/* (B Button) Spin Attack */}
              <button
                onClick={handleTriggerAttack}
                className="bg-rose-500 hover:bg-rose-400 border-rose-300 text-slate-950 font-black text-xs p-2.5 rounded-xl border flex items-center justify-center gap-1 shadow-lg active:scale-90 transition"
                title="Spin Attack Energy Blast (Keyboard: Shift/J / Gamepad B)"
              >
                <span className="w-5 h-5 rounded-full bg-slate-950 text-rose-400 flex items-center justify-center font-mono text-[10px] font-bold">B</span>
                <span className="hidden sm:inline font-bold text-[11px] text-slate-950">Attack</span>
              </button>

              {/* (A Button) Jump */}
              <button
                onClick={handleTriggerJump}
                className="bg-emerald-500 hover:bg-emerald-400 border-emerald-300 text-slate-950 font-black text-xs p-2.5 rounded-xl border flex items-center justify-center gap-1 shadow-lg active:scale-90 transition"
                title="Jump / Hop (Keyboard: Space / Gamepad A)"
              >
                <span className="w-5 h-5 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center font-mono text-[10px] font-bold">A</span>
                <span className="hidden sm:inline font-bold text-[11px] text-slate-950">Jump</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
