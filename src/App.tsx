/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { CausesDrawer } from './components/CausesDrawer';
import { DataSimulatorDrawer } from './components/DataSimulatorDrawer';
import { SolutionsDrawer } from './components/SolutionsDrawer';
import {
  GLOBAL_HUNGER_OVERVIEW,
  SCARCITY_CAUSES,
  ScarcityCause,
  VALLEY_WAYPOINTS,
} from './data/hungerData';
import { audioStore } from './engine/audioEngine';
import { ValleyEngine } from './engine/ValleyEngine';
import {
  calculateFoodSecurityProjection,
  getActiveValleyWaypoint,
  SimulatorInputs,
} from './utils/scarcityLogic';

type ActiveView = 'valley' | 'causes' | 'data' | 'solutions';

const DEFAULT_SIMULATOR_INPUTS: SimulatorInputs = {
  conflictResolutionPercent: 35,
  climateAdaptationPercent: 30,
  wasteReductionPercent: 40,
  waterEfficiencyPercent: 25,
};

export default function App() {
  const valleyRootRef = useRef<HTMLDivElement | null>(null);
  const valleyInstanceRef = useRef<ValleyEngine | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isIntroDone, setIsIntroDone] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const [activeView, setActiveView] = useState<ActiveView>('valley');
  const [selectedCauseId, setSelectedCauseId] = useState<string>(SCARCITY_CAUSES[0].id);
  const [activeWaypointId, setActiveWaypointId] = useState<string>(VALLEY_WAYPOINTS[0].id);

  const [simulatorInputs, setSimulatorInputs] = useState<SimulatorInputs>(
    DEFAULT_SIMULATOR_INPUTS
  );
  const [selectedSolutionIds, setSelectedSolutionIds] = useState<string[]>([
    'cold-chain',
    'regenerative-ag',
  ]);

  const activeWaypointIdRef = useRef(activeWaypointId);
  activeWaypointIdRef.current = activeWaypointId;

  useEffect(() => {
    const rootEl = valleyRootRef.current;
    if (!rootEl) return;

    audioStore().initAudio();

    let introShown = false;
    let lastWaypointCheck = 0;

    const valley = new ValleyEngine(
      rootEl,
      () => {
        setIsLoaded(true);
      },
      () => {
        if (!introShown) {
          introShown = true;
          setIsIntroDone(true);
          document.body.dataset.state = 'ready';
        }
      },
      (normProgress) => {
        const now = performance.now();
        if (now - lastWaypointCheck > 220) {
          lastWaypointCheck = now;
          const wp = getActiveValleyWaypoint(normProgress);
          if (wp.id !== activeWaypointIdRef.current) {
            activeWaypointIdRef.current = wp.id;
            setActiveWaypointId(wp.id);
          }
        }
      }
    );

    valleyInstanceRef.current = valley;
    window.__valleyInstance = valley;

    return () => {
      valley.dispose();
      valleyInstanceRef.current = null;
    };
  }, []);

  // Sync Simulator Vitality with 3D Valley Engine
  useEffect(() => {
    const proj = calculateFoodSecurityProjection(simulatorInputs);
    valleyInstanceRef.current?.setVitalityMultiplier(proj.valleyVitalityScore);
  }, [simulatorInputs]);

  const handleToggleSound = () => {
    const s = audioStore();
    if (!s.isInitialized) {
      s.initAudio();
    }
    const nextMuted = s.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleSelectCause = (cause: ScarcityCause) => {
    setSelectedCauseId(cause.id);
    valleyInstanceRef.current?.setBiomePalette(
      cause.valleyColorPrimary,
      cause.valleyColorSecondary,
      cause.valleyFogTint
    );
    valleyInstanceRef.current?.flyToProgress(cause.cameraProgressTarget);
  };

  const handleJumpToWaypoint = (progress: number, wpId: string) => {
    setActiveWaypointId(wpId);
    valleyInstanceRef.current?.flyToProgress(progress);
    if (wpId === 'wp-origin') {
      valleyInstanceRef.current?.setBiomePalette('#f5efe2', '#e8b85c', '#050608');
    } else if (wpId === 'wp-conflict') {
      handleSelectCause(SCARCITY_CAUSES[0]);
    } else if (wpId === 'wp-climate') {
      handleSelectCause(SCARCITY_CAUSES[1]);
    } else if (wpId === 'wp-waste') {
      handleSelectCause(SCARCITY_CAUSES[3]);
    } else if (wpId === 'wp-renewal') {
      handleSelectCause(SCARCITY_CAUSES[4]);
    }
  };

  const handleToggleSolution = (id: string) => {
    setSelectedSolutionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const currentWaypoint =
    VALLEY_WAYPOINTS.find((w) => w.id === activeWaypointId) ?? VALLEY_WAYPOINTS[0];

  return (
    <>
      {/* Full-screen 3D Night Flower & Golden Grain Valley */}
      <div id="valley" ref={valleyRootRef} aria-hidden="true" data-testid="valley-canvas">
        <div className="js-canvas-container" />
      </div>

      {/* Atmospheric vignette */}
      <div className="valley-vignette" aria-hidden="true" />

      {/* Main Interface Layer */}
      <div className={`ui ${isIntroDone ? 'on' : ''}`} id="ui">
        {/* Top Bar Contract: Zone 1 (Wordmark) — Zone 2 (Concise Nav Links) — Zone 3 (1 Primary Pill CTA) */}
        <header className="fernhollow-header">
          <a
            className="logo"
            href="#valley"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('valley');
              valleyInstanceRef.current?.setBiomePalette('#f5efe2', '#e8b85c', '#050608');
            }}
            aria-label="Fernhollow — Түнгі дән алқабы басты беті"
          >
            Fernhollow
          </a>

          <nav className="fernhollow-nav" aria-label="Негізгі навигация">
            <button
              type="button"
              onClick={() => setActiveView('valley')}
              className={`nav-link desktop-only-link ${
                activeView === 'valley' ? 'active' : ''
              }`}
            >
              Алқап
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('causes');
                handleSelectCause(
                  SCARCITY_CAUSES.find((c) => c.id === selectedCauseId) ?? SCARCITY_CAUSES[0]
                );
              }}
              className={`nav-link ${activeView === 'causes' ? 'active' : ''}`}
            >
              Себептер
            </button>
            <button
              type="button"
              onClick={() => setActiveView('data')}
              className={`nav-link ${activeView === 'data' ? 'active' : ''}`}
            >
              Деректер
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('solutions');
                valleyInstanceRef.current?.setBiomePalette('#a8e6cf', '#56ab91', '#05120d');
              }}
              className="pill"
            >
              Шешім жолдары
            </button>
          </nav>
        </header>

        {/* Centered Hero Section (Visible when exploring the 3D Valley) */}
        <main>
          <section
            className={`hero ${activeView !== 'valley' ? 'hero-dimmed' : ''}`}
            aria-label="Басты тақырып"
          >
            <p className="hero-kicker">{GLOBAL_HUNGER_OVERVIEW.topicKicker}</p>
            <h1>{GLOBAL_HUNGER_OVERVIEW.heroHeadline}</h1>
            <p className="cap">
              {GLOBAL_HUNGER_OVERVIEW.heroSubheadline}
              <br />
              Әлемде 733 миллион адам созылмалы аштықпен бетпе-бет келуде — себептерін зерттеңіз.
            </p>
            <button
              type="button"
              className="go"
              id="go"
              aria-label="Азық-түлік тапшылығының себептерін ашу"
              onPointerEnter={() => valleyInstanceRef.current?.startHoverTransition()}
              onPointerLeave={() => valleyInstanceRef.current?.stopHoverTransition()}
              onClick={() => {
                valleyInstanceRef.current?.stopHoverTransition();
                setActiveView('causes');
                handleSelectCause(SCARCITY_CAUSES[0]);
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12h16M14 6l6 6-6 6" />
              </svg>
            </button>
          </section>

          {/* Interactive Drawers for Causes, Data Simulator, and Solutions */}
          {activeView === 'causes' && (
            <CausesDrawer
              selectedCauseId={selectedCauseId}
              onSelectCause={handleSelectCause}
              onOpenSimulator={() => setActiveView('data')}
              onClose={() => setActiveView('valley')}
            />
          )}

          {activeView === 'data' && (
            <DataSimulatorDrawer
              inputs={simulatorInputs}
              onChangeInputs={setSimulatorInputs}
              onResetInputs={() => setSimulatorInputs(DEFAULT_SIMULATOR_INPUTS)}
              onOpenSolutions={() => {
                setActiveView('solutions');
                valleyInstanceRef.current?.setBiomePalette('#a8e6cf', '#56ab91', '#05120d');
              }}
              onClose={() => setActiveView('valley')}
            />
          )}

          {activeView === 'solutions' && (
            <SolutionsDrawer
              selectedActionIds={selectedSolutionIds}
              onToggleAction={handleToggleSolution}
              onClose={() => setActiveView('valley')}
            />
          )}
        </main>

        {/* Bottom-left Valley Waypoint Station Bar (active in Valley view) */}
        {activeView === 'valley' && (
          <aside
            className="valley-station-bar"
            aria-label="Алқап бекеттері"
            data-interactive="true"
          >
            <div className="rounded-xl border border-[#f5efe2]/15 bg-[#0c0b09]/85 px-4 py-3">
              <div className="flex items-center justify-between gap-4 text-[11px] font-mono uppercase tracking-[0.14em] text-[#e8b85c]">
                <span>{currentWaypoint.label}</span>
                <span className="tabular-nums">{currentWaypoint.metric}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-[#f5efe2]">
                {currentWaypoint.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#f5efe2]/75">
                {currentWaypoint.caption}
              </p>

              {/* Station jump buttons */}
              <div className="mt-2.5 flex items-center gap-1.5 pt-1">
                {VALLEY_WAYPOINTS.map((wp, idx) => {
                  const isActive = wp.id === currentWaypoint.id;
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => handleJumpToWaypoint(wp.progress, wp.id)}
                      aria-label={`Бекет 0${idx + 1}: ${wp.title}`}
                      className={`h-6 px-2 rounded text-[11px] font-mono tabular-nums transition ${
                        isActive
                          ? 'bg-[#f5efe2] text-[#151510] font-bold'
                          : 'bg-[#f5efe2]/10 text-[#f5efe2]/70 hover:bg-[#f5efe2]/25 hover:text-[#f5efe2]'
                      }`}
                    >
                      0{idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

        {/* Bottom-right Scroll Prompt & Sound Toggle (exact Fernhollow markup & behavior) */}
        <div className="corner">
          <span>Саяхаттау үшін айналдырыңыз</span>
          <i aria-hidden="true" />
          <button
            type="button"
            className="sound"
            id="sound"
            aria-pressed={!isMuted}
            aria-label="Атмосфералық дыбыс"
            onClick={handleToggleSound}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5Z" />
              <path
                className="w"
                d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"
              />
              <path className="x" d="m16 10 4 4m0-4-4 4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Initial Loader Overlay */}
      <div
        className={`loader ${isLoaded ? 'gone' : ''}`}
        id="loader"
        aria-hidden="true"
      >
        <span />
      </div>
    </>
  );
}
