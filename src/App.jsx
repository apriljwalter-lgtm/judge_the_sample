import { useCallback, useEffect, useMemo, useState } from "react";
import { population, TARGET, DATA_FILE } from "./data.js";
import {
  makeRng, trueMean, srs, systematic, stratified, sampleMean, groupShares,
  repeatedResult, summarizeEstimates, middleRange,
} from "./sampling.js";
import { GROUP_COLUMNS } from "./groups.js";
import { dollars, count, fixed } from "./format.js";
import MethodPanel from "./MethodPanel.jsx";
import GroupControls from "./GroupControls.jsx";
import SharesTable from "./SharesTable.jsx";
import ExperimentPanel from "./ExperimentPanel.jsx";
import ExperimentSettings from "./ExperimentSettings.jsx";
import ChallengeTab from "./ChallengeTab.jsx";
import useWholeNumberInput from "./useWholeNumberInput.js";
import NumberSlider from "./NumberSlider.jsx";
import Intro from "./Intro.jsx";
import CashRain from "./CashRain.jsx";
import SoundToggle from "./SoundToggle.jsx";
import Tour, { TOURS } from "./Tour.jsx";
import { celebrate, prefersReducedMotion, preloadSounds } from "./celebrate.js";
import { METHOD_COLORS } from "./methodColors.jsx";

const TABS = ["single", "experiments", "challenge"];
const INTRO_KEY = "judge-the-sample-intro-seen";
const TOUR_OFFER_KEY = "judge-the-sample-tour-offered";

// The opening scene plays once per browser tab (not on refresh), and never with "reduce motion".
function introAlreadySeen() {
  try {
    return sessionStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

const N = population.length;
const DEFAULT_N = 100;
const DEFAULT_SEED = 12345;
const MAX_SEED = 4294967295;
const EXPERIMENT_N = 100;
const SIZES_B = [1, 10, 100];

// The student's stratification column.
const STRATA_COLUMN = "age_band";
const STRATA_LEVELS = GROUP_COLUMNS.find((c) => c.key === STRATA_COLUMN).levels;

const levelsOf = (column) => GROUP_COLUMNS.find((c) => c.key === column).levels;

// The file's row order has no meaning beyond the order of the source file (required note).
const ROW_ORDER_NOTE = "The rows are in the order the file came in. That is not a time order.";

const people = (x) => `${count(x)} ${x === 1 ? "person" : "people"}`;

export default function App() {
  const truth = useMemo(() => trueMean(population, TARGET), []);
  const nInput = useWholeNumberInput(DEFAULT_N, 1, N);
  const seedInput = useWholeNumberInput(DEFAULT_SEED, 0, MAX_SEED);
  const n = nInput.value;
  const seed = seedInput.value;
  const [groupColumn, setGroupColumn] = useState("smoker");
  const [showIntro, setShowIntro] = useState(() => !introAlreadySeen() && !prefersReducedMotion());
  useEffect(() => preloadSounds(), []); // load the recorded money sounds in the background
  const finishIntro = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowIntro(false);
    // After the envelope on a first visit, offer the guided tour once per browser tab.
    try {
      if (sessionStorage.getItem(TOUR_OFFER_KEY) !== "1") {
        sessionStorage.setItem(TOUR_OFFER_KEY, "1");
        setTourOffer(true);
      }
    } catch {
      setTourOffer(true);
    }
  }, []);
  const [tourOffer, setTourOffer] = useState(false);
  const [touring, setTouring] = useState(false);
  const startTour = () => {
    setTourOffer(false);
    setTouring(true);
  };
  // The open tab is kept in the address (#single, #experiments or #challenge), so a refresh reopens it.
  const [tab, setTab] = useState(() => {
    const fromHash = window.location.hash.slice(1);
    return TABS.includes(fromHash) ? fromHash : "single";
  });
  useEffect(() => {
    window.history.replaceState(null, "", `#${tab}`);
  }, [tab]);

  // Remember how far down the page was scrolled, and return there after a refresh.
  // Per-viewer convenience only; if browser storage is unavailable the page still works.
  useEffect(() => {
    const KEY = "judge-the-sample-scroll";
    try {
      window.history.scrollRestoration = "manual";
      const saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (saved && saved.tab === window.location.hash) {
        requestAnimationFrame(() => window.scrollTo(0, saved.y));
      }
    } catch {
      /* ignore */
    }
    const save = () => {
      try {
        sessionStorage.setItem(KEY, JSON.stringify({ tab: window.location.hash, y: window.scrollY }));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("beforeunload", save);
    return () => window.removeEventListener("beforeunload", save);
  }, []);

  // Each method uses its own generator started from the same displayed seed.
  const srsResult = useMemo(() => {
    const rows = srs(population, n, makeRng(seed));
    return { rows, estimate: sampleMean(rows, TARGET) };
  }, [n, seed]);

  const sysResult = useMemo(() => {
    const r = systematic(population, n, makeRng(seed));
    return { ...r, estimate: sampleMean(r.rows, TARGET) };
  }, [n, seed]);

  const strResult = useMemo(
    () => (n < STRATA_LEVELS.length ? null : stratified(population, STRATA_COLUMN, n, makeRng(seed), TARGET, STRATA_LEVELS)),
    [n, seed]
  );

  const levels = levelsOf(groupColumn);
  const popShares = useMemo(() => groupShares(population, [], groupColumn, levels), [groupColumn, levels]);
  const sampleShares = useMemo(
    () => [
      { name: `Simple random (n = ${count(n)})`, method: "srs", shares: groupShares(population, srsResult.rows, groupColumn, levels) },
      { name: `Systematic (n = ${count(n)})`, method: "systematic", shares: groupShares(population, sysResult.rows, groupColumn, levels) },
      {
        name: `Stratified (n = ${count(n)})`,
        method: "stratified",
        shares: strResult ? groupShares(population, strResult.rows, groupColumn, levels) : null,
      },
    ],
    [n, srsResult, sysResult, strResult, groupColumn, levels]
  );

  // --- Stage 4: repeated-sampling experiments on the baseline population ---
  // Separate settings from the one-sample panels above. Results recalculate automatically
  // and replace the previous result whenever the seed or repetition count changes.
  const expSeedInput = useWholeNumberInput(DEFAULT_SEED, 0, MAX_SEED);
  const expSeed = expSeedInput.value;
  const [reps, setReps] = useState(100);

  const experiments = useMemo(() => {
    const base = { population, target: TARGET, reps, seed: expSeed };
    const run = (method, n) =>
      repeatedResult({ ...base, method, n, column: STRATA_COLUMN, levels: STRATA_LEVELS });
    const withSummary = (r) => ({ result: r, summary: summarizeEstimates(r.estimates, truth), range: middleRange(r.estimates) });

    // Experiment A: three methods, same n = 100. Each method uses its own generator from the same seed.
    const srs100 = withSummary(run("srs", EXPERIMENT_N));
    const a = [
      { key: "srs", label: "Simple random", color: METHOD_COLORS.srs, ...srs100 },
      { key: "sys", label: "Systematic", color: METHOD_COLORS.systematic, ...withSummary(run("systematic", EXPERIMENT_N)) },
      { key: "str", label: "Stratified by age group", color: METHOD_COLORS.stratified, ...withSummary(run("stratified", EXPERIMENT_N)) },
    ];
    a[0].note = "picked completely at random";
    a[1].note = "every so many rows down the file (" + a[1].result.design + ")";
    a[2].note = "picked at random inside each age group, weighted by group size";

    // Experiment B: simple random at n = 1, 10, 100. n = 100 reuses Experiment A's result
    // (same population, method, seed and repetitions).
    const b = SIZES_B.map((size) =>
      size === EXPERIMENT_N
        ? { key: `srs-${size}`, label: `Simple random, ${people(size)}`, color: METHOD_COLORS.srs, ...srs100, note: "same result as Experiment A" }
        : { key: `srs-${size}`, label: `Simple random, ${people(size)}`, color: METHOD_COLORS.srs, ...withSummary(run("srs", size)) }
    );

    return { a, b };
  }, [reps, expSeed, truth]);

  const common = { population, target: TARGET, groupColumn, truth, n, seed };

  // Display-only order for "Watch the draw". The samples themselves come from sampling.js; this only
  // decides the order in which the already-picked people light up.
  const drawOrders = useMemo(() => {
    const shuffle = (ids, r) => {
      const a = [...ids];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    return {
      srs: shuffle(srsResult.rows.map((r) => r.row_id), makeRng((seed + 7919) % 4294967296)),
      sys: sysResult.rows.map((r) => r.row_id),
      str: strResult ? strResult.strata.flatMap((st) => st.rows.map((r) => r.row_id)) : [],
    };
  }, [srsResult, sysResult, strResult, seed]);
  const showRows = (positions) => positions.slice(0, 8).join(", ") + (positions.length > 8 ? ", …" : "");

  return (
    <>
    {showIntro && <Intro onDone={finishIntro} />}
    <CashRain />
    <SoundToggle />
    {touring && <Tour key={tab} steps={TOURS[tab]} onClose={() => setTouring(false)} />}
    {tourOffer && !showIntro && !touring && (
      <div className="tour-offer" role="dialog" aria-label="Take the tour?">
        <p><strong>New here?</strong> Take a quick tour of this page.</p>
        <button type="button" className="button tour-next" onClick={startTour} autoFocus>Yes, show me</button>{" "}
        <button type="button" className="button" onClick={() => setTourOffer(false)}>No thanks</button>
      </div>
    )}
    <main>
      <header className="banknote">
        <span className="bn-corner tl" aria-hidden="true">$</span>
        <span className="bn-corner tr" aria-hidden="true">$</span>
        <span className="bn-corner bl" aria-hidden="true">$</span>
        <span className="bn-corner br" aria-hidden="true">$</span>
        <div className="bn-inner">
          <div className="bn-eyebrow">Follow the money</div>
          <h1>Judge the Sample: healthcare costs</h1>
          <p>
            This app uses one file of {count(N)} people (<code>{DATA_FILE}</code>), one simulated
            insurance record each. We want the mean of their medical charges (<code>{TARGET}</code>),
            in US dollars. It is a teaching dataset, not all patients or all claims.
          </p>
          <div className="bn-links">
            <button type="button" className="button bn-tour" onClick={startTour}>Show me around</button>
            <button type="button" className="link-button" onClick={() => setShowIntro(true)}>
              Replay intro
            </button>
          </div>
        </div>
      </header>

      <div className="tabs" role="tablist" aria-label="Page sections">
        {[
          ["single", "Single samples"],
          ["experiments", "Repeated-sampling experiments"],
          ["challenge", "Challenge: baseline vs modified"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? "tab active" : "tab"}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "single" && (
      <>
      <section className="card" data-tour="settings">
      <h2 className="card-title">Settings</h2>
      <div className="card-body">
        <div className="controls">
          <NumberSlider label="People per sample (n)" term="n" input={nInput} help="Used for all three methods." />
          <NumberSlider label="Seed" term="seed" input={seedInput} slider={false}
            help="A starting number for the random picks. The same seed and n always pick the same people." />
          <GroupControls value={groupColumn} onChange={(v) => { setGroupColumn(v); celebrate(); }} />
        </div>
      </div>
      </section>

      <section className="card">
        <h2 className="card-title">One sample from each method</h2>
        <div className="card-body">
          <div className="table-wrap">
            <table className="shares summary">
              <thead>
                <tr>
                  <th scope="col">Method</th>
                  <th scope="col">Sample mean from this one sample</th>
                  <th scope="col">Settings</th>
                </tr>
              </thead>
              <tbody>
                <tr className="truth-row">
                  <th scope="row">True population mean</th>
                  <td>{dollars(truth)}</td>
                  <td>all {count(N)} people</td>
                </tr>
                <tr>
                  <th scope="row">Simple random</th>
                  <td>{dollars(srsResult.estimate)}</td>
                  <td>n = {count(n)}, seed {seed}</td>
                </tr>
                <tr>
                  <th scope="row">Systematic</th>
                  <td>{dollars(sysResult.estimate)}</td>
                  <td>
                    n = {count(n)}, seed {seed}, {sysResult.design}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Stratified by age group</th>
                  <td>{strResult ? dollars(strResult.estimate) : "–"}</td>
                  <td>
                    {strResult
                      ? `n = ${count(n)}, seed ${seed}, proportional allocation`
                      : `not drawn: needs n of at least ${STRATA_LEVELS.length}`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="note">
            Each figure comes from one sample only, not repeated sampling. All three use the same n
            and seed.
          </p>
        </div>
      </section>

      <MethodPanel {...common} title="Simple random sampling" titleTerm="srs" rows={srsResult.rows}
        estimate={srsResult.estimate} estimateName="Sample mean" estimateTerm="sampleMean"
        receipt={{ method: "Simple random", methodTerm: "srs" }}
        drawOrder={drawOrders.srs} drawNote="People appear in random order.">
        <p>
          We picked {people(n)} completely at random from all {count(N)}, with no one picked twice.
          The figure is the plain mean of their charges.
        </p>
      </MethodPanel>

      <MethodPanel {...common} title="Systematic sampling with a random start" titleTerm="systematic" rows={sysResult.rows}
        estimate={sysResult.estimate} estimateName="Sample mean" estimateTerm="sampleMean"
        receipt={{ method: "Systematic", methodTerm: "systematic", extra: ["Design", sysResult.design] }}
        drawOrder={drawOrders.sys} drawNote="Going down the file in row order from a random start.">
        <p>
          We went down the file from a random starting spot and took one person{" "}
          {sysResult.design === "whole-number interval"
            ? `every ${count(sysResult.k)} rows`
            : `about every ${fixed(sysResult.k, 2)} rows`}{" "}
          (<strong>{sysResult.design}</strong> design). The figure is the plain mean of their
          charges. {ROW_ORDER_NOTE}
        </p>
        <details className="details">
          <summary>Show the details</summary>
          {sysResult.design === "whole-number interval" ? (
            <p>
              {count(N)} ÷ {count(n)} = {count(sysResult.k)} is a whole number, so the whole-number
              interval design applies. A random start r = {sysResult.start} was chosen from 1 to{" "}
              {count(sysResult.k)}, then every {count(sysResult.k)}th row was taken: rows{" "}
              {showRows(sysResult.positions)}
            </p>
          ) : (
            <p>
              {count(N)} ÷ {count(n)} = {fixed(sysResult.k, 4)} is not a whole number, so the
              fractional interval design applies. Interval k = {fixed(sysResult.k, 4)}; random start
              u = {fixed(sysResult.start, 4)} (between 0 and k); row j is the next whole number at or
              above u + j × k: rows {showRows(sysResult.positions)}
            </p>
          )}
          <p>
            Either way, every person has the same chance, {count(n)}/{count(N)}, of being picked.
          </p>
        </details>
      </MethodPanel>

      <MethodPanel {...common} title="Stratified sampling by age group" titleTerm="stratified" rows={strResult?.rows}
        estimate={strResult?.estimate} estimateName="Weighted estimate" estimateTerm="weighted"
        receipt={{ method: "Stratified", methodTerm: "stratified", extra: ["Allocation", "proportional"] }}
        drawOrder={drawOrders.str} drawNote="One age group at a time."
        message={
          strResult
            ? null
            : `Stratified sampling needs at least ${STRATA_LEVELS.length} people per sample (one from each age group), so no stratified sample is drawn at n = ${count(n)}.`
        }>
        {strResult && (
          <>
            <p>
              We split everyone into {STRATA_LEVELS.length} age groups ({STRATA_COLUMN}), gave each
              group a share of the {count(n)} places in proportion to its size, and picked people at
              random inside each group. Each group's mean then counts according to its share of
              all {count(N)} people (a <strong>population-weighted mean</strong>).
            </p>
            <p>
              <strong>People picked per age group (proportional allocation):</strong>{" "}
              {strResult.strata.map((s) => `${s.group}: ${count(s.nh)}`).join(" · ")} (total{" "}
              {count(strResult.strata.reduce((t, s) => t + s.nh, 0))})
            </p>
            <details className="details">
              <summary>Show the details</summary>
              <p>
                Places are shared out by largest-remainder rounding, at least 1 per group, never
                more than the group size. People are picked without replacement inside each group.
                Estimate = sum of (group size ÷ {count(N)}) × group's sample mean.
              </p>
              <div className="table-wrap">
                <table className="shares">
                  <thead>
                    <tr>
                      <th scope="col">Age group</th>
                      <th scope="col">Group size N_h</th>
                      <th scope="col">Weight N_h ÷ N</th>
                      <th scope="col">People picked n_h</th>
                      <th scope="col">Sample mean in group</th>
                      <th scope="col">Weight × group mean</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strResult.strata.map((s) => (
                      <tr key={s.group}>
                        <th scope="row">{s.group}</th>
                        <td>{count(s.Nh)}</td>
                        <td>{fixed(s.weight, 4)}</td>
                        <td>{count(s.nh)}</td>
                        <td>{dollars(s.mean)}</td>
                        <td>{dollars(s.weight * s.mean)}</td>
                      </tr>
                    ))}
                    <tr className="total">
                      <th scope="row">Total</th>
                      <td>{count(N)}</td>
                      <td>{fixed(strResult.strata.reduce((t, s) => t + s.weight, 0), 4)}</td>
                      <td>{count(strResult.strata.reduce((t, s) => t + s.nh, 0))}</td>
                      <td></td>
                      <td>{dollars(strResult.estimate)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </MethodPanel>

      <div data-tour="shares">
        <SharesTable column={groupColumn} population={popShares} samples={sampleShares} N={N} />
      </div>
      </>
      )}

      {tab === "experiments" && (
      <>
      <p>
        Here the computer takes many samples and works out the mean cost from each one. The
        charts show how much those means vary, and how close they land to the true mean.
        Everything uses the original {count(N)} people, unchanged.
      </p>

      <div data-tour="exp-settings">
      <ExperimentSettings seedInput={expSeedInput} seed={expSeed} maxSeed={MAX_SEED} reps={reps} onRepsChange={(r) => { setReps(r); celebrate(); }} />
      </div>

      <ExperimentPanel
        title={`Experiment A: three ways of picking ${EXPERIMENT_N} people`}
        results={experiments.a}
        truth={truth}
        N={N}
        intro={<>
          <p>
            Every sample has {EXPERIMENT_N} people, picked three ways: simple random, systematic,
            and stratified by age group.
          </p>
          <p className="note">
            Systematic: {count(N)} ÷ {EXPERIMENT_N}
            {N % EXPERIMENT_N === 0
              ? ` = ${count(N / EXPERIMENT_N)} is a whole number, so every possible starting spot is listed once (exact, no seed).`
              : ` = ${fixed(N / EXPERIMENT_N, 2)} is not a whole number, so the fractional-interval design is used with random starting spots (Monte Carlo).`}{" "}
            {ROW_ORDER_NOTE}
          </p>
        </>}
      />

      <ExperimentPanel
        tourId="experiment-b"
        title="Experiment B: does a bigger sample help? (simple random, 1, 10 or 100 people)"
        results={experiments.b}
        truth={truth}
        N={N}
        intro={
          <p>
            Same people, same method. Only the number of people per sample (n) changes: 1, 10 or
            100. This is separate from "samples taken", which is how many samples make each chart.
            The 100-person chart is the same result as in Experiment A.
          </p>
        }
      />
      </>
      )}

      {tab === "challenge" && <ChallengeTab population={population} truth={truth} maxSeed={MAX_SEED} />}
    </main>
    </>
  );
}
