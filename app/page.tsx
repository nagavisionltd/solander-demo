'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GameSceneManager } from '../src/engine/scene';
import { inputManager } from '../src/engine/input';
import { saveSystem, SolanderCreatureData, PlayerResources } from '../src/systems/save';
import { sound } from '../src/systems/audio';
import { ActivePrompt } from '../src/systems/interaction';
import { Sparkles, Heart, Compass, Volume2, VolumeX, BookOpen, ChevronRight, X, Footprints, Utensils, Zap, Shield, Flame, Gem, Sprout } from 'lucide-react';

export default function SolanderGamePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<GameSceneManager | null>(null);

  const [activePrompt, setActivePrompt] = useState<ActivePrompt | null>(null);
  const [fadeOpacity, setFadeOpacity] = useState<number>(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showPassport, setShowPassport] = useState<boolean>(false);
  const [showNurtureModal, setShowNurtureModal] = useState<boolean>(false);

  // Companion & Save state
  const [companion, setCompanion] = useState<SolanderCreatureData | null>(null);
  const [resources, setResources] = useState<PlayerResources>({ essence: 0, seeds: 0, crystals: 0 });
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
      setResources(state.resources || { essence: 0, seeds: 0, crystals: 0 });
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
          {/* Brand & World Info */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 px-4 shadow-xl text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-400 animate-pulse" />
              <h1 className="font-extrabold text-base tracking-wide bg-gradient-to-r from-sky-400 to-indigo-300 bg-clip-text text-transparent">
                PROJECT SOLANDER
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-300 font-medium">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>Location: {currentWorld === 'GARDEN' ? 'Solander Garden' : 'Mystic Valley'}</span>
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

          {/* Top Right Quick Controls */}
          <div className="flex items-center gap-2">
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

        {/* Bottom Interactive Controls */}
        <div className="flex justify-between items-end gap-4 pointer-events-auto pb-2">
          {/* Mobile Touch Virtual Joystick */}
          <div
            ref={joystickRef}
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
            onMouseDown={handleJoystickStart}
            onMouseMove={handleJoystickMove}
            onMouseUp={handleJoystickEnd}
            className="relative w-28 h-28 bg-slate-900/60 border-2 border-slate-700/80 rounded-full flex items-center justify-center backdrop-blur-md shadow-2xl touch-none cursor-grab"
          >
            <div className="text-[10px] font-bold text-slate-400 select-none">MOVE</div>
            <div
              className="absolute w-12 h-12 bg-sky-500/80 border-2 border-sky-300 rounded-full shadow-lg transition-transform duration-75"
              style={{
                transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
              }}
            />
          </div>

          {/* Action Buttons & Desktop Controls Helper */}
          <div className="flex flex-col items-center gap-2">
            {/* Context Proximity Prompt Button */}
            {activePrompt ? (
              <button
                onClick={handleTriggerInteraction}
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-sm py-3 px-6 rounded-full shadow-xl border-2 border-sky-300/60 flex items-center gap-2 transform active:scale-95 transition-all animate-pulse"
              >
                <span>{activePrompt.actionText}</span>
                <span className="bg-sky-700 text-sky-100 px-2 py-0.5 rounded-md text-xs font-mono">E</span>
              </button>
            ) : (
              <div className="bg-slate-900/70 backdrop-blur-md text-slate-300 text-xs px-3 py-1.5 rounded-full border border-slate-800">
                WASD / Joystick to Walk • Drag to Look
              </div>
            )}

            {/* Jump Button */}
            <button
              onClick={handleTriggerJump}
              className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2 px-5 rounded-full border border-slate-700 flex items-center gap-1.5 shadow-lg active:scale-95 transition"
            >
              <Footprints className="w-4 h-4 text-emerald-400" />
              <span>Jump</span>
              <span className="text-[10px] text-slate-400 font-mono">(Space)</span>
            </button>
          </div>
        </div>
      </div>

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
              Feed Companion
            </h3>

            {/* Feeding Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  const success = saveSystem.feedCompanion('essence');
                  if (success) sound.playChirp();
                }}
                disabled={resources.essence <= 0}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-sky-500/30 p-2.5 rounded-2xl flex flex-col items-center gap-1 transition"
              >
                <Sparkles className="w-5 h-5 text-sky-400" />
                <span className="text-[11px] font-bold text-sky-300">Essence</span>
                <span className="text-[10px] text-slate-400">({resources.essence})</span>
              </button>

              <button
                onClick={() => {
                  const success = saveSystem.feedCompanion('seeds');
                  if (success) sound.playChirp();
                }}
                disabled={resources.seeds <= 0}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-emerald-500/30 p-2.5 rounded-2xl flex flex-col items-center gap-1 transition"
              >
                <Sprout className="w-5 h-5 text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-300">Seeds</span>
                <span className="text-[10px] text-slate-400">({resources.seeds})</span>
              </button>

              <button
                onClick={() => {
                  const success = saveSystem.feedCompanion('crystals');
                  if (success) sound.playChirp();
                }}
                disabled={resources.crystals <= 0}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-purple-500/30 p-2.5 rounded-2xl flex flex-col items-center gap-1 transition"
              >
                <Gem className="w-5 h-5 text-purple-400" />
                <span className="text-[11px] font-bold text-purple-300">Crystals</span>
                <span className="text-[10px] text-slate-400">({resources.crystals})</span>
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
    </div>
  );
}
