import React from 'react';
import { GLOBAL_HUNGER_OVERVIEW, REGIONAL_HUNGER_STATS } from '../data/hungerData';
import {
  calculateFoodSecurityProjection,
  SimulatorInputs,
} from '../utils/scarcityLogic';

interface DataSimulatorDrawerProps {
  inputs: SimulatorInputs;
  onChangeInputs: (next: SimulatorInputs) => void;
  onResetInputs: () => void;
  onOpenSolutions: () => void;
  onClose: () => void;
}

export const DataSimulatorDrawer: React.FC<DataSimulatorDrawerProps> = ({
  inputs,
  onChangeInputs,
  onResetInputs,
  onOpenSolutions,
  onClose,
}) => {
  const projection = calculateFoodSecurityProjection(inputs);

  const updateField = (key: keyof SimulatorInputs, value: number) => {
    onChangeInputs({
      ...inputs,
      [key]: value,
    });
  };

  return (
    <section
      aria-label="Жаһандық деректер және азық-түлік қауіпсіздігі симуляторы"
      data-interactive="true"
      className="fixed inset-x-0 bottom-0 top-[82px] z-10 flex flex-col justify-between overflow-y-auto px-5 pb-24 pt-4 md:px-11 md:pb-28"
    >
      <div className="mx-auto w-full max-w-[1280px] rounded-2xl border border-[#f5efe2]/15 bg-[#0c0b09]/95 p-5 shadow-2xl md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#f5efe2]/12 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e8b85c]">
              БҰҰ ФАО / ДДҰ статистикасы және Интерактивті модельдеу
            </p>
            <h2 className="mt-1 font-['Oswald','Antonio',sans-serif] text-3xl uppercase tracking-tight text-[#f5efe2] md:text-4xl">
              Жаһандық аштық деректері және Тұрақтылық симуляторы
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenSolutions}
              className="rounded-lg border border-[#e8b85c]/50 bg-[#e8b85c]/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f5efe2] transition hover:bg-[#e8b85c] hover:text-[#151510]"
            >
              Шешім жолдары →
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

        {/* Top 4 Global Key Indicators */}
        <div className="mt-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <div className="rounded-xl border border-[#f5efe2]/12 bg-[#14120e] p-4">
            <span className="text-xs uppercase tracking-[0.12em] text-[#f5efe2]/60">
              Созылмалы аштықтағы халық
            </span>
            <p className="mt-1 font-['Oswald','Antonio',sans-serif] text-4xl tabular-nums text-[#f5efe2]">
              {GLOBAL_HUNGER_OVERVIEW.chronicHungerMillions} млн
            </p>
            <span className="mt-1 block text-xs text-[#f5efe2]/60">
              Әлемдегі әрбір 11-ші адам
            </span>
          </div>

          <div className="rounded-xl border border-[#f5efe2]/12 bg-[#14120e] p-4">
            <span className="text-xs uppercase tracking-[0.12em] text-[#f5efe2]/60">
              Азық-түлік тапшылығы (орта/жоғары)
            </span>
            <p className="mt-1 font-['Oswald','Antonio',sans-serif] text-4xl tabular-nums text-[#e8b85c]">
              {GLOBAL_HUNGER_OVERVIEW.insecurityBillions} млрд
            </p>
            <span className="mt-1 block text-xs text-[#f5efe2]/60">
              Тұрақты тамаққа қолы жетпейді
            </span>
          </div>

          <div className="rounded-xl border border-[#f5efe2]/12 bg-[#14120e] p-4">
            <span className="text-xs uppercase tracking-[0.12em] text-[#f5efe2]/60">
              Жылдық азық-түлік ысырабы
            </span>
            <p className="mt-1 font-['Oswald','Antonio',sans-serif] text-4xl tabular-nums text-[#f5efe2]">
              {GLOBAL_HUNGER_OVERVIEW.annualFoodWasteBillionTons} млрд т
            </p>
            <span className="mt-1 block text-xs text-[#f5efe2]/60">
              Өндірілген өнімнің 33%-ы жоғалады
            </span>
          </div>

          <div className="rounded-xl border border-[#f5efe2]/12 bg-[#14120e] p-4">
            <span className="text-xs uppercase tracking-[0.12em] text-[#f5efe2]/60">
              Сапалы мәзірге шамасы жетпейтіндер
            </span>
            <p className="mt-1 font-['Oswald','Antonio',sans-serif] text-4xl tabular-nums text-[#f5efe2]">
              {GLOBAL_HUNGER_OVERVIEW.unaffordableDietBillions} млрд
            </p>
            <span className="mt-1 block text-xs text-[#f5efe2]/60">
              Азық-түлік инфляциясының салдары
            </span>
          </div>
        </div>

        {/* Interactive Simulator + Regional Table Split */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Simulator Controls */}
          <div className="rounded-xl border border-[#f5efe2]/15 bg-[#15130f] p-5 lg:col-span-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold uppercase tracking-[0.12em] text-[#e8b85c]">
                Азық-түлік тапшылығын азайту симуляторы
              </h3>
              <button
                type="button"
                onClick={onResetInputs}
                className="text-xs uppercase tracking-[0.12em] text-[#f5efe2]/65 underline hover:text-[#f5efe2]"
              >
                Қалпына келтіру
              </button>
            </div>
            <p className="mt-1 text-xs text-[#f5efe2]/70">
              Төмендегі 4 факторды өзгертіп, жаһандық аштықтың қаншалықты қысқаратынын және 3D алқаптың қалай гүлдейтінін көріңіз:
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium">
                  <label htmlFor="slider-peace">
                    1. Қақтығыстарды тоқтату және гуманитарлық дәліздер
                  </label>
                  <span className="font-mono tabular-nums text-[#e8b85c]">
                    {inputs.conflictResolutionPercent}%
                  </span>
                </div>
                <input
                  id="slider-peace"
                  type="range"
                  min={0}
                  max={100}
                  value={inputs.conflictResolutionPercent}
                  onChange={(e) =>
                    updateField('conflictResolutionPercent', Number(e.target.value))
                  }
                  className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#2c2820] accent-[#e8b85c]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium">
                  <label htmlFor="slider-climate">
                    2. Климатқа төзімді егіншілік және топырақты қорғау
                  </label>
                  <span className="font-mono tabular-nums text-[#e8b85c]">
                    {inputs.climateAdaptationPercent}%
                  </span>
                </div>
                <input
                  id="slider-climate"
                  type="range"
                  min={0}
                  max={100}
                  value={inputs.climateAdaptationPercent}
                  onChange={(e) =>
                    updateField('climateAdaptationPercent', Number(e.target.value))
                  }
                  className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#2c2820] accent-[#e8b85c]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium">
                  <label htmlFor="slider-waste">
                    3. Азық-түлік ысырабы мен қойма шығынын қысқарту
                  </label>
                  <span className="font-mono tabular-nums text-[#e8b85c]">
                    {inputs.wasteReductionPercent}%
                  </span>
                </div>
                <input
                  id="slider-waste"
                  type="range"
                  min={0}
                  max={100}
                  value={inputs.wasteReductionPercent}
                  onChange={(e) =>
                    updateField('wasteReductionPercent', Number(e.target.value))
                  }
                  className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#2c2820] accent-[#e8b85c]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium">
                  <label htmlFor="slider-water">
                    4. Тамшылатып суару және су ресурстарын үнемдеу
                  </label>
                  <span className="font-mono tabular-nums text-[#e8b85c]">
                    {inputs.waterEfficiencyPercent}%
                  </span>
                </div>
                <input
                  id="slider-water"
                  type="range"
                  min={0}
                  max={100}
                  value={inputs.waterEfficiencyPercent}
                  onChange={(e) =>
                    updateField('waterEfficiencyPercent', Number(e.target.value))
                  }
                  className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#2c2820] accent-[#e8b85c]"
                />
              </div>
            </div>

            {/* Calculated Live Output Box */}
            <div
              data-testid="simulator-results"
              className="mt-5 grid grid-cols-3 gap-3 rounded-xl border border-[#e8b85c]/30 bg-[#0c0b09] p-4"
            >
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#f5efe2]/60">
                  Қалған аштық деңгейі
                </span>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#f5efe2]">
                  {projection.remainingHungryMillions} млн
                </p>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#f5efe2]/60">
                  Құтқарылған адамдар
                </span>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#a8e6cf]">
                  +{projection.peopleLiftedMillions} млн
                </p>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#f5efe2]/60">
                  Үнемделген астық
                </span>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#e8b85c]">
                  {projection.savedGrainMillionTons} млн т
                </p>
              </div>
              <div className="col-span-3 border-t border-[#f5efe2]/10 pt-2.5 flex items-center justify-between text-xs">
                <span className="text-[#f5efe2]/75">Болжамдық күй: {projection.statusLabel}</span>
                <span className="font-mono tabular-nums text-[#e8b85c]">
                  Аштықтың қысқаруы: {projection.hungerReductionPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Regional Hunger Data Table */}
          <div className="rounded-xl border border-[#f5efe2]/15 bg-[#15130f] p-5 lg:col-span-6">
            <h3 className="text-base font-semibold uppercase tracking-[0.12em] text-[#f5efe2]">
              Аймақтар бойынша азық-түлік тапшылығының деңгейі
            </h3>
            <p className="mt-1 text-xs text-[#f5efe2]/65">
              Созылмалы тамақ жетіспеушілігі, азық-түлік инфляциясы және негізгі себептер:
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#f5efe2]/15 text-[#f5efe2]/60">
                    <th className="pb-2.5 font-medium">Аймақ</th>
                    <th className="pb-2.5 text-right font-medium">Аштық (млн)</th>
                    <th className="pb-2.5 text-right font-medium">Үлесі (%)</th>
                    <th className="pb-2.5 text-right font-medium">Су тапшылығы</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5efe2]/10">
                  {REGIONAL_HUNGER_STATS.map((row) => (
                    <tr key={row.id} className="hover:bg-[#f5efe2]/5">
                      <td className="py-3 pr-2">
                        <div className="font-semibold text-[#f5efe2]">{row.region}</div>
                        <div className="mt-0.5 text-[11px] text-[#f5efe2]/60">
                          {row.primaryDriver}
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono font-semibold tabular-nums text-[#e8b85c]">
                        {row.undernourishedMillions}
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums text-[#f5efe2]">
                        {row.prevalencePercent}%
                      </td>
                      <td className="py-3 text-right text-[#f5efe2]/85">
                        {row.waterStressLevel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
