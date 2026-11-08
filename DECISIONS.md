# My decisions and evidence notes

Written by me, not by my AI agent. Write my challenge hypothesis (section 5) **before** consulting
my agent about it, and do not edit it afterwards; add a dated revision below instead.

| Stage | What I record here |
|---|---|
| 1 | Section 1 | 
| 2–5 | Section 2: my design choice, written before I switch my agent to build |
| 4 | Section 3: method and sample-size rows; section 4: findings (a) and (b) |
| 5 | Section 5: hypothesis first; then section 3: challenge rows; section 5: finding (c) |
| All | Section 6: AI use |

## 1. Population and target

- Scenario and file: Healthcare costs, data/healthcare_costs.csv. 
- One row means:  One row means one person (a beneficiary record)
- Number of rows (N): 1338
- Row order, and what it means in this file: In this file row order has no documented meaning and is not a time sequence. 
- Target column and units: The target column is charges in US dollars. 
- My finite population is (and what it is not): This is a finite population of 1338 people where the true mean can be calculated, the data is simulated and does not represent real patients. 
- True mean I calculated (and how): The true mean of the charges column is 13270.42 rounded to 2 decimal places since it's in dollars. I calculated it by asking Claude for the code to check the true mean of the charges column. The code when run in the terminal loaded every row, converted each charge from text to a number, then added them all up and divided by 1338 (the total number of rows).

## 2. Design choices

For each stage: the option I chose, why, and what it is meant to help a user learn.

- Stage 2, visualization (include one visual feature meant to reveal a sampling problem): I chose a dot strip on a dollar line so every person can be visualized, they are colored by group which changes when switched between radio buttons, and I chose the shares table to compare the sample with the whole population.  I think this will be a pretty simplified view to show the changes in the sample for another healthcare worker. These working together will reveal if there is a problem with the sample such as being imbalanced. 
- Stage 3, sampling interactions and stratification column: I selected to display all three sampling methods together for easy comparison.  They will each display its own mean. I chose to stratify by age_band. This should help the learner to easily compare the sampling differences and make a judgement about how the methods compare to each other. 
- Stage 4, presentation of the method comparison and sample-size experiments: 
- Stage 5, challenge controls and my alternative method or correction: 

## 3. Results table

One row per result I read from my app. Add rows as needed. Rerun and update a row whenever I
like: my app does not need to keep a history of runs. Seed is "exact" for exact enumeration;
type is Monte Carlo or exact. In Settings I record the settings that matter for the result, such
as the stratification column and allocation, or my challenge-control values. True mean is the
true mean of the population that result was drawn from (the modified copy's own recalculated
value for modified rows). Keep each result in its own row: never pool estimates.

| Experiment | Population or condition | Method | Settings | Seed (or exact) | n | Repetitions or starts | Type | True mean | Bias | SD | RMSE |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Methods at n = 100 | baseline | Simple random | | | 100 | | | | | | |
| Methods at n = 100 | baseline | Systematic | | | 100 | | | | | | |
| Methods at n = 100 | baseline | Stratified | | | 100 | | | | | | |
| Sample size | baseline | Simple random | | | 1 | | | | | | |
| Sample size | baseline | Simple random | | | 10 | | | | | | |
| Challenge | baseline | (method I challenged) | | | | | | | | | |
| Challenge | modified | (method I challenged) | | | | | | | | | |
| Challenge | baseline | (alternative or correction) | | | | | | | | | |
| Challenge | modified | (alternative or correction) | | | | | | | | | |

The simple random n = 100 row is also the n = 100 sample-size result when the population and
settings match. If I reran it with different settings, I add a separate row. All four challenge
rows use the same n; a challenge baseline row may repeat a matching stage 4 result.

## 4. Findings (in my own words, using my own numbers)

- (a) Method comparison: the three sampling methods compared at n = 100 (bias versus variability, and for which population):
- (b) Sample-size finding: how sample size affects the spread of estimates and the estimation error, and what a larger sample cannot fix:

## 5. Challenge (hypothesis written independently, before consulting my agent)

Hypothesis, written before I consult my agent:

- Date written:
- Method I chose to challenge:
- The change to the population or its ordering:
- Why the selection rule would interact with that change:
- Evidence I expect across repeated samples:
- Alternative method or correction I will compare, and why:
- Evidence that would contradict my hypothesis:

After I test it:

- Test settings (conditions, methods, alternative method or correction, n, seeds); results are in the table above:
- (c) Challenge interpretation: did the evidence support my hypothesis? Bias versus variability, other explanations, what the alternative or correction showed, and any dated revision (keep the original above):

## 6. AI use

- Tools used:
- What I asked my agent to do, and what I checked myself:
Section 1- I asked for the code to check the true mean, but ran it myself in the terminal. 
Section 2- 
Stage 2- AI checked, all rows load and charges are read as numbers, the true mean matches the original, the sample is n=100, its the same seed
Stage 3- AI checked these all add up to n=100, its the same seed as previously, the systematic gives different rows and each  has an equal chance, the stratified grabs from each group


- Automated checks my agent reported (I did not let it interpret my results):
