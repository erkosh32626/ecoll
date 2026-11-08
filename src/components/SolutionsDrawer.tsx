import React from 'react';
import { SOLUTION_ACTIONS } from '../data/hungerData';
import { calculateSelectedSolutionsImpact } from '../utils/scarcityLogic';

interface SolutionsDrawerProps {
  selectedActionIds: string[];
  onToggleAction: (id: string) => void;
  onClose: () => void;
}

export const SolutionsDrawer: React.FC<SolutionsDrawerProps> = ({
  selectedActionIds,
  onToggleAction,
  onClose,
}) => {
  const impact = calculateSelectedSolutionsImpact(selectedActionIds);

  return (
    <section
      aria-label="Аштық мәселесін шешу жолдары"
      data-interactive="true"
      className="fixed inset-x-0 bottom-0 top-[82px] z-10 flex flex-col justify-between overflow-y-auto px-5 pb-24 pt-4 md:px-11 md:pb-28"
    >
      <div className="mx-auto w-full max-w-[1280px] rounded-2xl border border-[#f5efe2]/15 bg-[#0c0b09]/95 p-5 shadow-2xl md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#f5efe2]/12 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a8e6cf]">
              Регенеративті болашақ · Іс-қимыл жоспары
            </p>
            <h2 className="mt-1 font-['Oswald','Antonio',sans-serif] text-3xl uppercase tracking-tight text-[#f5efe2] md:text-4xl">
              Азық-түлік тапшылығын еңсерудің 5 нақты шешімі
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Алқап көрінісіне оралу"
            className="rounded-lg border border-[#f5efe2]/25 px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-[#f5efe2]/85 transition hover:border-[#f5efe2] hover:text-[#f5efe2]"
          >
            Алқапқа оралу ✕
          </button>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#f5efe2]/80">
          Төмендегі жаһандық және жергілікті бастамаларды таңдап, олардың біріккен кезде қанша миллион тонна астықты сақтап, қанша адамды аштықтан құтқара алатынын есептеңіз:
        </p>

        {/* Solutions Grid */}
        <div className="mt-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {SOLUTION_ACTIONS.map((item) => {
            const isChecked = selectedActionIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isChecked}
                onClick={() => onToggleAction(item.id)}
                className={`flex flex-col justify-between rounded-xl border p-4 text-left transition ${
                  isChecked
                    ? 'border-[#a8e6cf] bg-[#13221c] text-[#f5efe2]'
                    : 'border-[#f5efe2]/12 bg-[#14120e] text-[#f5efe2]/80 hover:border-[#f5efe2]/35'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-[#e8b85c]">
                      {item.code} · {item.category}
                    </span>
                    <span className="font-medium text-[#a8e6cf]">
                      {isChecked ? '✓ Қосылды' : '+ Таңдау'}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold leading-snug text-[#f5efe2]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#f5efe2]/70">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#f5efe2]/10 pt-3 font-mono text-xs tabular-nums">
                  <span className="text-[#e8b85c]">+{item.annualGrainSavedMt} млн т астық</span>
                  <span className="text-[#a8e6cf]">+{item.peopleFedMillions} млн адам</span>
                </div>
              </button>
            );
          })}

          {/* Cumulative Impact Summary Card */}
          <div
            data-testid="solutions-summary"
            className="flex flex-col justify-between rounded-xl border border-[#e8b85c]/40 bg-[#1a1710] p-5"
          >
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e8b85c]">
                Таңдалған шаралардың жиынтық әсері ({impact.count} / {SOLUTION_ACTIONS.length})
              </span>
              <div className="mt-4 space-y-3">
                <div className="flex items-baseline justify-between border-b border-[#f5efe2]/10 pb-2">
                  <span className="text-xs text-[#f5efe2]/70">Құтқарылатын халық саны:</span>
                  <span className="font-['Oswald','Antonio',sans-serif] text-3xl tabular-nums text-[#a8e6cf]">
                    {impact.totalPeopleMillions} млн адам
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-b border-[#f5efe2]/10 pb-2">
                  <span className="text-xs text-[#f5efe2]/70">Жылдық үнемделген астық:</span>
                  <span className="font-mono text-lg font-semibold tabular-nums text-[#e8b85c]">
                    {impact.totalGrainMt} млн тонна
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#f5efe2]/70">Үнемделген тұщы су қоры:</span>
                  <span className="font-mono text-lg font-semibold tabular-nums text-[#f5efe2]">
                    {impact.totalWaterKm3} км³ / жыл
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[#f5efe2]/65">
              Әрбір үнемделген тонна астық пен қорғалған топырақ қабаты — миллиондаған баланың болашағы.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
