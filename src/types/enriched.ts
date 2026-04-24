import type { Schichtplanung } from './app';

export type EnrichedSchichtplanung = Schichtplanung & {
  mitarbeiter_refName: string;
  schicht_refName: string;
};
