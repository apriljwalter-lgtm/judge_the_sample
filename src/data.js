// Loads the student's chosen population. data/ is read only, never changed.
import csvText from "../data/healthcare_costs.csv?raw";
import { parseCsv } from "./parse.js";

export const DATA_FILE = "data/healthcare_costs.csv";
export const TARGET = "charges"; // US dollars
export const NUMERIC_COLUMNS = ["row_id", "age", "bmi", "children", "charges"];

/** The whole finite population: every row of the file, nothing more. */
export const population = parseCsv(csvText, NUMERIC_COLUMNS);
