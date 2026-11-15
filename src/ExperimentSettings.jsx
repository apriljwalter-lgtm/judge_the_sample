import { count } from "./format.js";
import Term from "./Term.jsx";

const REPETITION_CHOICES = [100, 1000];

// Settings for the repeated-sampling experiments: repetitions (radio buttons) and seed.
export default function ExperimentSettings({ seedInput, seed, maxSeed, reps, onRepsChange }) {
  return (
    <section className="card">
      <h2 className="card-title">Experiment settings</h2>
      <div className="card-body controls">
        <fieldset className="radios">
          <legend><Term id="reps">Samples taken for each chart (repetitions)</Term></legend>
          {REPETITION_CHOICES.map((r) => (
            <label key={r}>
              <input
                type="radio"
                name="repetitions"
                value={r}
                checked={reps === r}
                onChange={() => onRepsChange(r)}
              />
              {count(r)} samples
            </label>
          ))}
        </fieldset>
        <div className="field" style={{ marginTop: 10 }}>
          <Term id="seed"><label htmlFor="experiment-seed">Seed</label></Term>{" "}
          <span>
            <input
              id="experiment-seed"
              type="text"
              inputMode="numeric"
              value={seedInput.text}
              onChange={(e) => seedInput.onChange(e.target.value.trim())}
              aria-invalid={!seedInput.isValid}
            />
          </span>{" "}
          {seedInput.isValid ? (
            <span>A starting number for the random picks. The same seed gives the same results.</span>
          ) : (
            <span className="error">
              Enter a whole number from 0 to {maxSeed}. Still showing seed {seed}.
            </span>
          )}
        </div>
        <p className="note">
          Results update as soon as you change a setting and replace the old ones. 100 samples
          usually show the main pattern; 1,000 give smoother charts and steadier numbers. Neither is
          a guarantee, and 100 cannot reliably tell small differences apart. Try a few seeds to see
          whether what you notice still holds.
        </p>
      </div>
    </section>
  );
}
