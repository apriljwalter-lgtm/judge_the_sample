import { useMemo, useState } from "react";
import { TARGET, DATA_FILE } from "./data.js";
import {
  addSimulatedChildren, presentLevels, CHILD_BAND, MAX_ADDED, trueMean, repeatedResult,
  summarizeEstimates, middleRange,
} from "./sampling.js";
import { dollars, count, fixed } from "./format.js";
import ExperimentPanel from "./ExperimentPanel.jsx";
import useWholeNumberInput from "./useWholeNumberInput.js";
import NumberSlider from "./NumberSlider.jsx";
import Term from "./Term.jsx";
import { celebrate } from "./celebrate.js";
import { METHOD_COLORS } from "./methodColors.jsx";

// Stage 5: the student's challenge. A labelled MODIFIED copy of the population (simulated
// children added, per the student's dated hypothesis revision) compared with the BASELINE,
// using the student's chosen method (stratified by age group) and alternative (simple random).
// Every calculation comes from sampling.js; each result is measured against its own population's
// true mean, and baseline and modified results are never pooled.

const HYPOTHESIS = { count: 374, smokerPct: 2, copySeed: 12345 };
const COLUMN = "age_band";
const BAND_ORDER = [CHILD_BAND, "18-29", "30-39", "40-49", "50-64"];
const REPETITION_CHOICES = [100, 1000];

export default function ChallengeTab({ population, truth, maxSeed }) {
  const N = population.length;

  // Modified-population settings (preset to the student's hypothesis values).
  const childrenIn = useWholeNumberInput(HYPOTHESIS.count, 0, MAX_ADDED);
  const copySeedIn = useWholeNumberInput(HYPOTHESIS.copySeed, 0, maxSeed);
  const resetToHypothesis = () => {
    childrenIn.reset(HYPOTHESIS.count);
    copySeedIn.reset(HYPOTHESIS.copySeed);
    celebrate();
  };

  // Experiment settings (the same n for all four results).
  const nIn = useWholeNumberInput(100, 1, N);
  const seedIn = useWholeNumberInput(12345, 0, maxSeed);
  const [reps, setReps] = useState(100);
  const n = nIn.value;
  const seed = seedIn.value;

  const range = useMemo(() => {
    const values = population.map((r) => r[TARGET]);
    return { lo: Math.min(...values), hi: Math.max(...values) };
  }, [population]);

  const modified = useMemo(
    () => addSimulatedChildren(population, {
      count: childrenIn.value, smokerShare: HYPOTHESIS.smokerPct / 100, seed: copySeedIn.value, target: TARGET,
    }),
    [population, childrenIn.value, copySeedIn.value]
  );
  const modTruth = useMemo(() => trueMean(modified, TARGET), [modified]);

  const describe = useMemo(() => {
    const sim = modified.filter((r) => r.simulated);
    const sizes = (pop) => BAND_ORDER.map((g) => pop.filter((r) => r[COLUMN] === g).length);
    return {
      added: sim.length,
      baseSizes: sizes(population),
      modSizes: sizes(modified),
      baseLevels: presentLevels(population, COLUMN, BAND_ORDER),
      modLevels: presentLevels(modified, COLUMN, BAND_ORDER),
    };
  }, [population, modified]);

  const groupsNeeded = Math.max(describe.baseLevels.length, describe.modLevels.length);
  const nTooSmall = n < groupsNeeded;

  const results = useMemo(() => {
    if (nTooSmall) return null;
    const baseLabel = `Baseline (${count(N)} people)`;
    const modLabel = `Modified (${count(modified.length)} people, ${count(describe.added)} simulated)`;
    const run = (key, label, popLabel, pop, levels, method, t, note) => {
      const result = repeatedResult({ method, population: pop, target: TARGET, n, reps, seed, column: COLUMN, levels });
      return {
        key, label, note, population: popLabel, truth: t, result,
        color: METHOD_COLORS[method], modified: pop !== population,
        summary: summarizeEstimates(result.estimates, t), range: middleRange(result.estimates),
      };
    };
    const strNote = (levels) => `${levels.length} age groups, proportional allocation`;
    return [
      run("str-base", "Stratified by age group · baseline", baseLabel, population, describe.baseLevels, "stratified", truth, strNote(describe.baseLevels)),
      run("str-mod", "Stratified by age group · modified", modLabel, modified, describe.modLevels, "stratified", modTruth, strNote(describe.modLevels)),
      run("srs-base", "Simple random · baseline", baseLabel, population, null, "srs", truth, "picked completely at random"),
      run("srs-mod", "Simple random · modified", modLabel, modified, null, "srs", modTruth, "picked completely at random"),
    ];
  }, [nTooSmall, N, modified, describe, n, reps, seed, population, truth, modTruth]);

  return (
    <>
      <p>
        This tab tests the challenge hypothesis (DECISIONS.md, section 5). It builds a labeled{" "}
        <strong>modified copy</strong> of the population by adding simulated children aged 0-17, then
        compares stratified sampling by age group with simple random sampling on both the{" "}
        <strong>baseline</strong> and the <strong>modified</strong> population, all at the same n.
      </p>

      <section className="card" data-tour="mod-settings">
        <h2 className="card-title"><Term id="modified">Modified population settings</Term></h2>
        <div className="card-body controls">
          <NumberSlider label="Simulated children added (aged 0-17)" input={childrenIn} sliderMax={1000}
            help={`Preset to the hypothesis value: ${HYPOTHESIS.count}.`} />
          <NumberSlider label="Modified-copy seed" term="seed" input={copySeedIn} slider={false}
            help="Makes the simulated rows repeatable: the same settings and seed always build the same copy." />
          <p>
            <button type="button" className="button" onClick={resetToHypothesis}>
              Reset to the hypothesis values
            </button>
          </p>
          <p className="note">
            How each simulated row is made: age 0-17 (equal chance), age group "0-17"; charges with an
            equal chance of any value from {dollars(range.lo)} to {dollars(range.hi)} (the lowest and
            highest charges in the original file); female/male 50/50; each of the 4 regions 25%;
            children 0; bmi left blank; ages 14-17 each have a {HYPOTHESIS.smokerPct}% chance of being
            a smoker (ages 0-13 never; smoking is not used by either method or by the charges);
            placed at random positions in the row order.{" "}
            <strong>These are simulated rows, not real patients or real charges.</strong> The original
            file (<code>{DATA_FILE}</code>) is unchanged; the modified copy exists only in this page.
          </p>
        </div>
      </section>

      <section className="card" data-tour="populations">
        <h2 className="card-title">Baseline and modified populations</h2>
        <div className="card-body">
          <div className="table-wrap">
            <table className="shares">
              <thead>
                <tr>
                  <th scope="col" rowSpan={2}></th>
                  <th scope="colgroup" colSpan={2} className="group-head">Baseline</th>
                  <th scope="colgroup" colSpan={2} className="group-head">Modified</th>
                </tr>
                <tr>
                  <th scope="col">People</th>
                  <th scope="col">Weight</th>
                  <th scope="col">People</th>
                  <th scope="col">Weight</th>
                </tr>
              </thead>
              <tbody>
                {BAND_ORDER.map((g, i) => (
                  <tr key={g}>
                    <th scope="row">Age group {g}</th>
                    <td>{count(describe.baseSizes[i])}</td>
                    <td>{describe.baseSizes[i] ? fixed(describe.baseSizes[i] / N, 4) : "–"}</td>
                    <td>{count(describe.modSizes[i])}</td>
                    <td>{describe.modSizes[i] ? fixed(describe.modSizes[i] / modified.length, 4) : "–"}</td>
                  </tr>
                ))}
                <tr className="total">
                  <th scope="row">All people (N)</th>
                  <td>{count(N)}</td>
                  <td>1.0000</td>
                  <td>{count(modified.length)}</td>
                  <td>1.0000</td>
                </tr>
                <tr className="truth-row">
                  <th scope="row">True mean (all rows)</th>
                  <td colSpan={2}>{dollars(truth)}</td>
                  <td colSpan={2}>{dollars(modTruth)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="note">
            Simulated rows added: {count(describe.added)}. Weight = group size ÷ all people in that
            population. Each population's true mean is calculated from its own rows. These describe
            the two populations; they are not sampling results.
          </p>
        </div>
      </section>

      <section className="card" data-tour="ch-settings">
        <h2 className="card-title">Challenge experiment settings</h2>
        <div className="card-body controls">
          <NumberSlider label="People per sample (n)" term="n" input={nIn}
            help="The same n for all four results." />
          <fieldset className="radios">
            <legend>Samples taken for each result (repetitions)</legend>
            {REPETITION_CHOICES.map((r) => (
              <label key={r}>
                <input type="radio" name="challenge-repetitions" value={r} checked={reps === r}
                  onChange={() => { setReps(r); celebrate(); }} />
                {count(r)} samples
              </label>
            ))}
          </fieldset>
          <NumberSlider label="Seed" term="seed" input={seedIn} slider={false}
            help="A starting number for the random picks. The same seed gives the same results." />
          <p className="note">
            Results update as soon as you change a setting and replace the old ones. 100 samples
            usually show the main pattern; 1,000 give smoother charts and steadier numbers. Neither is
            a guarantee, and 100 cannot reliably tell small differences apart. Try a few seeds to see
            whether what you notice still holds.
          </p>
        </div>
      </section>

      {nTooSmall ? (
        <section className="card">
          <h2 className="card-title">Challenge results</h2>
          <div className="card-body">
            <p className="message">
              Stratified sampling needs at least {groupsNeeded} people per sample here (one from each
              age group), so no results are drawn at n = {count(n)}. All four results use the same n.
            </p>
          </div>
        </section>
      ) : (
        <ExperimentPanel
          tourId="ch-results"
          title={`Challenge results: four results at ${count(n)} people per sample`}
          results={results}
          truth={truth}
          N={N}
          intro={
            <p className="note">
              Each result is compared with the true mean of the population it was drawn from: the
              baseline's {dollars(truth)} or the modified copy's {dollars(modTruth)}. Baseline and
              modified results are shown side by side but never combined. With n = 100, seed 12345 and
              100 samples, the two baseline rows are the same results as in the Repeated-sampling
              experiments tab.
            </p>
          }
        />
      )}
    </>
  );
}
