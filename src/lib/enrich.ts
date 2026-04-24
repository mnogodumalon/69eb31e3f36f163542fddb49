import type { EnrichedSchichtplanung } from '@/types/enriched';
import type { Mitarbeiter, Schichtdefinition, Schichtplanung } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface SchichtplanungMaps {
  mitarbeiterMap: Map<string, Mitarbeiter>;
  schichtdefinitionMap: Map<string, Schichtdefinition>;
}

export function enrichSchichtplanung(
  schichtplanung: Schichtplanung[],
  maps: SchichtplanungMaps
): EnrichedSchichtplanung[] {
  return schichtplanung.map(r => ({
    ...r,
    mitarbeiter_refName: resolveDisplay(r.fields.mitarbeiter_ref, maps.mitarbeiterMap, 'vorname', 'nachname'),
    schicht_refName: resolveDisplay(r.fields.schicht_ref, maps.schichtdefinitionMap, 'schichtname'),
  }));
}
