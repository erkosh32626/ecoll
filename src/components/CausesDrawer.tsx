import React from 'react';
import { GLOBAL_HUNGER_OVERVIEW, SCARCITY_CAUSES, ScarcityCause } from '../data/hungerData';

interface CausesDrawerProps {
  selectedCauseId: string;
  onSelectCause: (cause: ScarcityCause) => void;
  onOpenSimulator: () => void;
  onClose: () => void;
}

export const CausesDrawer: React.FC<CausesDrawerProps> = ({
  selectedCauseId,
  onSelectCause,
  onOpenSimulator,
  onClose,
}) => {
  const activeCause =
    SCARCITY_CAUSES.find((c) => c.id === selectedCauseId) ?? SCARCITY_CAUSES[0];

  return (
    <section
      aria-label="Азық-түлік тапшылығының себептері"
      data-interactive="true"
      className="fixed inset-x-0 bottom-0 top-[82px] z-10 flex flex-col justify-between overflow-y-auto px-5 pb-24 pt-4 md:px-11 md:pb-28"
    >
      <div className="mx-auto w-full max-w-[1280px] rounded-2xl border border-[#f5efe2]/15 bg-[#0c0b09]/95 p-5 shadow-2xl md:p-8">
        {/* Top bar inside panel */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#f5efe2]/12 pb-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[#e8b85c]">
              ЖАҺАНДЫҚ ТАЛДАУ · {GLOBAL_HUNGER_OVERVIEW.topicKicker}
            </p>
            <h2 className="mt-1 font-['Oswald','Antonio',sans-serif] text-3xl uppercase tracking-tight text-[#f5efe2] md:text-4xl">
              Азық-түлік тапшылығының 5 негізгі себебі
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenSimulator}
              className="rounded-lg border border-[#e8b85c]/50 bg-[#e8b85c]/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f5efe2] transition hover:bg-[#e8b85c] hover:text-[#151510]"
            >
              Деректер мен Симулятор →
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Алқап көрінісіне оралу"
              className="rounded-lg border border-[#f5efe2]/25 px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-[#f5efe2]/85 transition hover:border-[#f5efe2] hover:text-[#f5efe2]"
            >
              Алқапқа оралу ✕
            </button>
          </div>
        </div>

        {/* Interactive Cause Selector Tabs */}
        <div
          role="tablist"
          aria-label="Тапшылық себептері"
          className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-5"
        >
          {SCARCITY_CAUSES.map((cause) => {
            const isSelected = cause.id === activeCause.id;
            return (
              <button
                key={cause.id}
                role="tab"
                aria-selected={isSelected}
                type="button"
                onClick={() => onSelectCause(cause)}
                className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition ${
                  isSelected
                    ? 'border-[#e8b85c] bg-[#1e1b14] text-[#f5efe2]'
                    : 'border-[#f5efe2]/12 bg-[#14120e]/80 text-[#f5efe2]/70 hover:border-[#f5efe2]/35 hover:text-[#f5efe2]'
                }`}
              >
                <div className="flex w-full items-center justify-between text-xs font-mono tabular-nums text-[#e8b85c]">
                  <span>{cause.index}. СЕБЕП</span>
                  <span>{cause.sharePercent}% үлес</span>
                </div>
                <span className="mt-1.5 text-sm font-semibold leading-snug">
                  {cause.shortTitle}
                </span>
                <span className="mt-1 text-xs font-mono tabular-nums text-[#f5efe2]/60">
                  {cause.affectedMillions} млн адам
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Cause Detailed Content */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.15em] text-[#f5efe2]/65">
              <span>Фактор #{activeCause.index}</span>
              <span aria-hidden="true">·</span>
              <span>Зардап шеккендер: {activeCause.affectedMillions} миллион адам</span>
            </div>

            <h3 className="mt-2 text-2xl font-semibold leading-tight text-[#f5efe2] md:text-3xl">
              {activeCause.title}
            </h3>

            <p className="mt-2 text-sm font-medium text-[#e8b85c]">
              {activeCause.subtitle}
            </p>

            <p className="mt-4 text-sm leading-relaxed text-[#f5efe2]/85 md:text-base">
              {activeCause.summary}
            </p>

            <div className="mt-5 border-t border-[#f5efe2]/12 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f5efe2]/70">
                Дағдарыстың қалыптасу механизмдері
              </h4>
              <ul className="mt-3 space-y-2.5">
                {activeCause.mechanisms.map((mech, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm leading-relaxed text-[#f5efe2]/90"
                  >
                    <span className="font-mono text-xs font-semibold text-[#e8b85c] tabular-nums">
                      0{idx + 1}.
                    </span>
                    <span>{mech}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Key Metrics & Regional Hotspots */}
          <div className="flex flex-col justify-between rounded-xl border border-[#f5efe2]/12 bg-[#14120f] p-5 lg:col-span-5">
            <div>
              <div className="flex items-baseline justify-between border-b border-[#f5efe2]/10 pb-4">
                <div>
                  <span className="text-xs uppercase tracking-[0.14em] text-[#f5efe2]/60">
                    {activeCause.keyMetricLabel}
                  </span>
                  <p className="mt-1 font-['Antonio','Oswald',sans-serif] text-5xl tabular-nums text-[#e8b85c]">
                    {activeCause.keyMetricValue}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase tracking-[0.14em] text-[#f5efe2]/60">
                    Жаһандық аштықтағы үлесі
                  </span>
                  <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#f5efe2]">
                    {activeCause.sharePercent}%
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-xs uppercase tracking-[0.14em] text-[#f5efe2]/60">
                  Ең қатты зардап шеккен аймақтар
                </span>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-[#f5efe2]">
                  {activeCause.regionExample}
                </p>
              </div>

              {/* Proportion Breakdown Bar across all 5 causes */}
              <div className="mt-5 border-t border-[#f5efe2]/10 pt-4">
                <div className="flex items-center justify-between text-xs text-[#f5efe2]/70">
                  <span>Жалпы 733 млн аштық құрылымы</span>
                  <span className="font-mono tabular-nums">100%</span>
                </div>
                <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-[#26231d]">
                  {SCARCITY_CAUSES.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        width: `${c.sharePercent}%`,
                        backgroundColor:
                          c.id === activeCause.id ? c.valleyColorPrimary : 'rgba(245,239,226,0.22)',
                      }}
                      title={`${c.shortTitle}: ${c.sharePercent}%`}
                      className="h-full border-r border-[#0c0b09] transition-all duration-300"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-[#f5efe2]/10 pt-4 text-xs text-[#f5efe2]/65">
              3D түнгі алқаптың жарық гүлдері мен атмосферасы таңдалған себептің («{activeCause.shortTitle}») экологиялық күйіне сәйкес бейімделді.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
