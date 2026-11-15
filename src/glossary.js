// Plain-language definitions shown by the gold coin buttons (Term.jsx). They explain what each
// term means; they never describe or predict any result.
export const GLOSSARY = {
  trueMean:
    "The mean charge of everyone in the population: all 1,338 people in the file (or every row of the modified copy). It is the number the samples are trying to estimate.",
  sampleMean: "The mean charge of the people picked in one sample. It is that sample's estimate of the true mean.",
  weighted:
    "The stratified estimate: each age group's sample mean, multiplied by that group's share of the whole population, then added up.",
  n: "People per sample (n): how many people are picked in one sample.",
  seed: "A starting number for the random picks. The same seed and settings always pick the same people.",
  srs: "Simple random sampling: every possible group of n people is equally likely to be picked, and no one is picked twice.",
  systematic:
    "Systematic sampling: start at a random spot in the file, then take every k-th person going down the file's row order.",
  stratified:
    "Stratified sampling: split people into groups (here, age groups), pick at random inside each group in proportion to its size, then combine the group means using each group's share of the population.",
  bias: "Bias (mean miss): how far the mean of the sample means is from the true mean. A minus sign means below.",
  sd: "SD (spread): how much the sample means vary from one sample to the next.",
  rmse: "RMSE (typical error): the typical miss for one sample, combining bias and spread (RMSE² = bias² + SD²).",
  middle95: "The range holding the middle 95% of the sample means: 2.5% of them fall below it and 2.5% above it.",
  monteCarlo:
    "Monte Carlo: the computer draws many random samples. Because they are random, a bias that is not exactly zero can be chance.",
  exact: "Exact: every possible starting spot is listed once, with no randomness and no seed.",
  reps: "Samples taken (repetitions): how many separate samples the computer draws for each result. Not the same as people per sample.",
  modified:
    "Modified population: a copy of the file with simulated children added. The original file is never changed, and the copy has its own true mean.",
};
