import { useMemo, useState } from "react";
import { population, TARGET, DATA_FILE } from "./data.js";
import { makeRng, trueMean, srs, sampleMean, groupShares } from "./sampling.js";
import { GROUP_COLUMNS, colourFor } from "./groups.js";
import { dollars, count } from "./format.js";
import PopulationStrip from "./PopulationStrip.jsx";
import GroupControls from "./GroupControls.jsx";
import SharesTable from "./SharesTable.jsx";

// Stage 2 only: a temporary simple random sample used to test the display.
const TEMP_N = 100;
const DEFAULT_SEED = 12345;
const MAX_SEED = 4294967295;

export default function App() {
  const N = population.length;
  const truth = useMemo(() => trueMean(population, TARGET), []);

  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [seedText, setSeedText] = useState(String(DEFAULT_SEED));
  const [groupColumn, setGroupColumn] = useState("smoker");

  const sample = useMemo(() => srs(population, TEMP_N, makeRng(seed)), [seed]);
  const sampledIds = useMemo(() => new Set(sample.map((r) => r.row_id)), [sample]);
  const estimate = useMemo(() => sampleMean(sample, TARGET), [sample]);

  const levels = GROUP_COLUMNS.find((c) => c.key === groupColumn).levels;
  const shares = useMemo(
    () => groupShares(population, sample, groupColumn, levels),
    [sample, groupColumn, levels]
  );

  const seedValid = /^\d+$/.test(seedText) && Number(seedText) <= MAX_SEED;
  function onSeedChange(text) {
    setSeedText(text);
    if (/^\d+$/.test(text) && Number(text) <= MAX_SEED) setSeed(Number(text));
  }

  return (
    <main>
      <h1>Judge the Sample: healthcare costs</h1>

      <p>
        <strong>Population:</strong> all {count(N)} people (one beneficiary record per row) in{" "}
        <code>{DATA_FILE}</code>, a simulated teaching dataset. It is not all patients or all
        insurance claims. <strong>Target:</strong> <code>{TARGET}</code>, individual medical costs
        billed, in US dollars.
      </p>

      <div className="banner" role="note">
        <strong>TEMPORARY TEST SAMPLE (stage 2 only).</strong> One simple random sample of{" "}
        {TEMP_N} people, drawn without replacement, used only to test this display. The sampling
        methods (simple random, systematic and stratified) are added in stage 3.
      </div>

      <div className="seed">
        <label>
          Seed{" "}
          <input
            type="text"
            inputMode="numeric"
            value={seedText}
            onChange={(e) => onSeedChange(e.target.value.trim())}
            aria-invalid={!seedValid}
          />
        </label>{" "}
        {seedValid ? (
          <span>
            Sample drawn with seed <strong>{seed}</strong>. The same seed always gives the same sample.
          </span>
        ) : (
          <span className="error">
            Enter a whole number from 0 to {MAX_SEED}. Still showing the sample for seed {seed}.
          </span>
        )}
      </div>

      <GroupControls value={groupColumn} onChange={setGroupColumn} />

      <section className="chart-section">
        <h2>Charges for all {count(N)} people, with the temporary sample highlighted</h2>
        <div className="chart-layout">
          <figure>
            <PopulationStrip
              population={population}
              target={TARGET}
              sampledIds={sampledIds}
              groupColumn={groupColumn}
              truth={truth}
              estimate={estimate}
            />
            <figcaption>
              One dot per person, placed left to right by their charges. All {count(N)} people are
              shown. Up-down position has no meaning; it only keeps dots from overlapping. Hover over
              a dot to see its row.
            </figcaption>
          </figure>

          <aside className="side-legend" aria-label="Chart legend">
            <h3>Mean lines</h3>
            <dl className="means">
              <div>
                <dt>
                  <span className="key-line" aria-hidden="true" /> True population mean
                </dt>
                <dd>{dollars(truth)}</dd>
                <dd className="note">all {count(N)} people</dd>
              </div>
              <div>
                <dt>
                  <span className="key-line dashed" aria-hidden="true" /> Temporary sample mean
                </dt>
                <dd>{dollars(estimate)}</dd>
                <dd className="note">
                  one sample, n = {TEMP_N}, seed {seed}
                </dd>
              </div>
            </dl>

            <h3>Dots</h3>
            <ul>
              <li>
                <span className="key-solid" aria-hidden="true" /> In temporary sample
              </li>
              <li>
                <span className="key-faint" aria-hidden="true" /> Not in sample
              </li>
            </ul>

            <h3>Colour: {groupColumn}</h3>
            <ul>
              {levels.map((g) => (
                <li key={g}>
                  <span className="swatch" style={{ background: colourFor(groupColumn, g) }} aria-hidden="true" />
                  {g}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <SharesTable shares={shares} column={groupColumn} N={N} n={TEMP_N} />
    </main>
  );
}
