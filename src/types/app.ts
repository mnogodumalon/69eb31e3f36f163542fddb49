// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Mitarbeiter {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    personalnummer?: string;
    abteilung?: string;
    beschaeftigungsart?: LookupValue;
    telefon?: string;
    email?: string;
    eintrittsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    bemerkungen?: string;
  };
}

export interface Schichtdefinition {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    schichtname?: string;
    kuerzel?: string;
    schichtbeginn?: string;
    schichtende?: string;
    schichttyp?: LookupValue;
    schichtbeschreibung?: string;
  };
}

export interface Schichtplanung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    datum?: string; // Format: YYYY-MM-DD oder ISO String
    mitarbeiter_ref?: string; // applookup -> URL zu 'Mitarbeiter' Record
    schicht_ref?: string; // applookup -> URL zu 'Schichtdefinition' Record
    arbeitsbereich?: string;
    status?: LookupValue;
    notizen?: string;
  };
}

export const APP_IDS = {
  MITARBEITER: '69eb31ca00a109d9305cc8f7',
  SCHICHTDEFINITION: '69eb31cfd2b8634d5207588f',
  SCHICHTPLANUNG: '69eb31d0cef13ab397a4d85f',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'mitarbeiter': {
    beschaeftigungsart: [{ key: "vollzeit", label: "Vollzeit" }, { key: "teilzeit", label: "Teilzeit" }, { key: "minijob", label: "Minijob" }, { key: "aushilfe", label: "Aushilfe" }],
  },
  'schichtdefinition': {
    schichttyp: [{ key: "fruehschicht", label: "Frühschicht" }, { key: "spaetschicht", label: "Spätschicht" }, { key: "nachtschicht", label: "Nachtschicht" }, { key: "tagschicht", label: "Tagschicht" }, { key: "sonderschicht", label: "Sonderschicht" }],
  },
  'schichtplanung': {
    status: [{ key: "geplant", label: "Geplant" }, { key: "bestaetigt", label: "Bestätigt" }, { key: "abwesend", label: "Abwesend" }, { key: "vertreten", label: "Vertreten" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'mitarbeiter': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'personalnummer': 'string/text',
    'abteilung': 'string/text',
    'beschaeftigungsart': 'lookup/select',
    'telefon': 'string/tel',
    'email': 'string/email',
    'eintrittsdatum': 'date/date',
    'bemerkungen': 'string/textarea',
  },
  'schichtdefinition': {
    'schichtname': 'string/text',
    'kuerzel': 'string/text',
    'schichtbeginn': 'string/text',
    'schichtende': 'string/text',
    'schichttyp': 'lookup/select',
    'schichtbeschreibung': 'string/textarea',
  },
  'schichtplanung': {
    'datum': 'date/date',
    'mitarbeiter_ref': 'applookup/select',
    'schicht_ref': 'applookup/select',
    'arbeitsbereich': 'string/text',
    'status': 'lookup/select',
    'notizen': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateMitarbeiter = StripLookup<Mitarbeiter['fields']>;
export type CreateSchichtdefinition = StripLookup<Schichtdefinition['fields']>;
export type CreateSchichtplanung = StripLookup<Schichtplanung['fields']>;