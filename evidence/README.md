# Evidence

Save supporting evidence for your submission here: screenshots or exported tables from your own
app. They back up the numbers in the results table in `DECISIONS.md`; they are not extra written
reports.

Name each file by what it shows. In it or beside it, note the population or condition, method,
settings, seed (if the result is random), n, and the number of repetitions or exact-enumeration
starts. One labelled file per comparison is enough:

- `method-comparison-n100.png` (or `.csv`)
- `sample-size-comparison.png`
- `challenge-baseline-vs-modified.png`

A challenge file may show baseline and modified results together, as long as each result is
labelled separately; never pool their estimates. Your app does not need to keep a history of runs.


Stage 2- baseline population, temporary simple random sample, seed 12345, n=100, color by group

Stage 3- all three methods, n=100, seed 12345, color by age band

Stage 4- 
Experiment A: method comparison, baseline population, all 3 methods, n=100, seed 12345, 100 repetitions, all use Monte Carlo, method-comparison-n100-seed12345-100reps.png, method-comparison-n100-seed12345-100reps-table.png

Experiment B: sample size comparison, baseline population, simple random, n=1, 10, 100, seed 12345, 100 repetitions all use Monte Carlo,sample-size-comparison-srs-n1-10-100-seed12345-100reps.png.

Stage 5- challenge-baseline-vs-modified-n100-seed12345-100reps.png
challenge-baseline-vs-modified-n100-seed12345-100reps-table.png
baseline 1338 vs modified 1712, 374 simulated children, 2% smokers aged 14-17, copy seed 12345, stratified by age group and simple random
n=100, seed 12345, 100 repetitions, Monte Carlo