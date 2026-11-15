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
- Stage 4, presentation of the method comparison and sample-size experiments: I selected to display the information as histograms and to update automatically when the settings are changed. I am hoping this will show the spread of the comparison numbers better than tables that I already have selected. This should make the spread more visible to the learner so they can see the range of information. 
Revision 11/14/26: After visualizing the data as histograms, I found them hard to understand what was being displayed, I asked AI to suggest a better alternative to display the data and chose range bars with faint sample dots, I am hoping it simplfies the information displayed and helps a user to see the difference in the samples.  
- Stage 5, challenge controls and my alternative method or correction: I selected a challenge tab sholing all four results in one chart with an adjustable setting for the modified poulation, but it is preset to my hypothesis values. I chose simple random as my alternative as I think it will vary most from the stratified samples. It should clearly demonstrate the change in population and how it impacts the sampling of the data. 


## 3. Results table

One row per result I read from my app. Add rows as needed. Rerun and update a row whenever I
like: my app does not need to keep a history of runs. Seed is "exact" for exact enumeration;
type is Monte Carlo or exact. In Settings I record the settings that matter for the result, such
as the stratification column and allocation, or my challenge-control values. True mean is the
true mean of the population that result was drawn from (the modified copy's own recalculated
value for modified rows). Keep each result in its own row: never pool estimates.

| Experiment | Population or condition | Method | Settings | Seed (or exact) | n | Repetitions or starts | Type | True mean | Bias | SD | RMSE |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Methods at n = 100 | baseline | Simple random |no replacement| 12345 | 100 | 100 | Monte Carlo | $13,270.42 | -$230.53 | $1,210.42| $1,232.18|
| Methods at n = 100 | baseline | Systematic | Fractional interval design | 12345| 100 |100| Monte Carlo | $13,270.42 | $76.92| $1,025.44| $1,028.32|
| Methods at n = 100 | baseline | Stratified |age_band, Proportional allocation| 12345|100 | 100 | Monte Carlo | $13,270.42| $66.08 | $1,269.04 | $1,270.76|
| Sample size | baseline | Simple random | no replacement | 12345| 1 |100|Monte Carlo |$13,270.42 |-$977.73 | $10,662.16 | $10,706.90|
| Sample size | baseline | Simple random | no replacement| 12345| 10 | 100|Monte Carlo|$13,270.42 | -$412.19|$3,587.07 | $3,610.68| 
| Challenge | baseline | stratified| 4 age groups proportional| 12345|100 |100 | Monte Carlo |$13270.42 |$66.08 | $1269.04|$1270.76 | 
| Challenge | modified | stratified | 5 age groups proportional 374 simulated children, 2% smokers 14–17, copy seed 12345|12345 |100 | 100| Monte Carlo|$17577.21|$204.89 |$1392.91 | $1407.90| 
| Challenge | baseline | simple random |no replacement| 12345 | 100| 100| Monte Carlo|$13270.42 |-$230.53 | $1210.42| $1232.18|
| Challenge | modified | simple random |374 simulated children, 2% smokers 14–17, copy seed 12345 no replacement |12345 | 100| 100|Monte Carlo | $17577.21|$90.76 |$1625.99| $1628.52| 

The simple random n = 100 row is also the n = 100 sample-size result when the population and
settings match. If I reran it with different settings, I add a separate row. All four challenge
rows use the same n; a challenge baseline row may repeat a matching stage 4 result.

## 4. Findings (in my own words, using my own numbers)

- (a) Method comparison: the three sampling methods compared at n = 100 (bias versus variability, and for which population): In comparing the three methods simple random, systematic, and stratified by age group they all are using the baseline population. Simple random has the highest bias (-$230.53) but the middle SD ($1210.42).  Systematic had the middle bias ($76.92) and the lowest spread ($1025.44). Stratified by age group had the lowest bias ($66.08) and the highest spread ($1269.04) but it also has the highest RMSE ($1270.76). For this population I would probably go with the systematic sampling because it has a lower bias than simple random's bias but a little higher than stratified's but it also has the smallest RMSE ($1028.32). The middle 95% of the sample means covers from $11197.28 to $14884.36.  This seems like a good middle ground to ensure the sample is inclusive enough of the full population. 
- (b) Sample-size finding: how sample size affects the spread of estimates and the estimation error, and what a larger sample cannot fix: The sample size affects the spread of estimates the most moving from 1 ($1428.45 to $39876.38) to 100 ($10707.61 to $15224.34). At 100 the spread is not very diverse like it is at 1 person. The RMSE for 1 person is also much larger at $10,706.90 compared to 100 people at $1,232.18. The larger sample cannot fix any bias in the sampling and the spread shrinks as the sample size grows. 

## 5. Challenge (hypothesis written independently, before consulting my agent)

Hypothesis, written before I consult my agent:  

- Date written: 11/14
- Method I chose to challenge: Stratefied by age group.
- The change to the population or its ordering: I want to only have 2 age groups with 18-40 being one and 40-64 being the other. 
- Why the selection rule would interact with that change: The group sizes and weights will most likely cange. 
- Evidence I expect across repeated samples: The mean will shift based on how the group is sized and weighted, I expect that the sample mean should shift closer to the true mean with a smaller bias. 
- Alternative method or correction I will compare, and why: I will compare against the existing breakdown with 4 age groups. 
- Evidence that would contradict my hypothesis: If the group weights are equal. 


Revision 11/14/26: I misunderstood what the population change was asking and would like add a new age group to the existing population 0-17, the mean would recalculate based on the new rows that get added. I would like to add a group of 374 (randomly selected number by me) children with generated AI charges that can be equal to or between the existing high and low numbers they are not real patients or real charges. For each other row sex will still be completed male or female randomly, bmi can be left blank as needed, children will always be no or 0 depending on the data inputs, if the child is greater than 13 randomly add a smoker into the population, and randomize the regions. Add a new age band 0-17 and they should get mixed into the existing data set.
New hypothesis:
- Date written: 11/14
- Method I chose to challenge: Stratefied by age group.
- The change to the population or its ordering I will be adding 374 of children age group 0-17 into the existing data with generated charges equal chance for any number between or equal to the existing high and low values, sex, bmi, children should be no or 0, if the child is greater than 13 AI will randomly add smokers into the population but the share of them should be 2%. The added children should have randomized ages equal chance for any age in the group, but following the other columns rules once age is selected. The new data should be placed at random positions in the row order. The chance for each sex should be 50/50 and 25% for each region. 
- Why the selection rule would interact with that change: The group weights will change based on the new data. 
- Evidence I expect across repeated samples: The mean will shift based on how the group is sized and weighted, I expect that the sample mean should shift closer to the true mean with a smaller bias than simplified random. 
- Alternative method or correction I will compare, and why: We could challenge it against the simplified random sampling to make a comparision with the new data and see how much variation there is. 
- Evidence that would contradict my hypothesis:
That the simplied random sampling mean actually has a smaller bias. 

After I test it:

- Test settings (conditions, methods, alternative method or correction, n, seeds); results are in the table above: Baseline was 1,338 people modified to 1,712 people, the change was 374 simulated children aged 0-17, 2% smoker chance for ages 14-17, copy seed 12345, the method challenged was stratified by age group baseline had 4, modified is 5, the alternative method was simple random, n=100, seed 12345, 100 samples, monte carlo
- (c) Challenge interpretation: did the evidence support my hypothesis? Bias versus variability, other explanations, what the alternative or correction showed, and any dated revision (keep the original above): My prediction was that  I expected the sample mean should shift closer to the true mean with a smaller bias than simple random which was not supported. Looking at the bias for the modified age group stratified ($204.89) vs the modified simple random ($90.76) the modified simple random is much smaller than the stratified. The sample means do not appear to have shifted closer to the new true means for the modified stratified group but the simple random modified did shift closer to the true mean.  The bias for the modified ($204.89) shifts significantly from the baseline ($66.08) for stratified with the baseline being much smaller.  We see that the simple random actually does the opposite where the modified get smaller ($90.76) from the baseline (-$230.53). The simple random baseline's SD has a larger shift $1210.42 to $1625.99 compared to stratified $1269.04 to $1392.91. The app drew monte carlo 100 random samples, if a different set of 100 samples was pulled in a different seed the results could vary greatly. 




## 6. AI use

- Tools used: Claude Code in VS Code
- What I asked my agent to do, and what I checked myself:
Section 1- I asked for the code to check the true mean, but ran it myself in the terminal. 
Section 2- 
Stage 2- AI checked, all rows load and charges are read as numbers, the true mean matches the original, the sample is n=100, its the same seed
Stage 3- AI checked these all add up to n=100, its the same seed as previously, the systematic gives different rows and each  has an equal chance, the stratified grabs from each group
Stage 4- AI built the repeated-sampling experiments, change the histograms to range bars, I also to simplify the wording and explanations on the pages
I ran the experiments, and chose the settings, filled in the results table, and wrote finding a and b 

Stage 5- AI was asked to build the challenge tab from the hypothesis
 I  completed the hypothesis and revision and ran the challenge, filled in the table, and wrote my findings. 


- Automated checks my agent reported (I did not let it interpret my results):

Stage 2- the data file was unchanged, and the true mean matches the calculated value and doesn't change if rows are reordered

Stage 3- the stratified estimate is the population-weighted mean
all three methods reproduce identical samples with the same seed

Stage 4
systematic uses exact enumeration only for a whole number interval
the n=100 simple random result is reused for experiment B

Stage 5
the original data file is unchanged
stratified uses 5 age groups on the modified copy, with the allocation adding up to n

