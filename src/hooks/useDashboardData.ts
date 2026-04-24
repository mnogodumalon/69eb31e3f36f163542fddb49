import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Mitarbeiter, Schichtdefinition, Schichtplanung } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([]);
  const [schichtdefinition, setSchichtdefinition] = useState<Schichtdefinition[]>([]);
  const [schichtplanung, setSchichtplanung] = useState<Schichtplanung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [mitarbeiterData, schichtdefinitionData, schichtplanungData] = await Promise.all([
        LivingAppsService.getMitarbeiter(),
        LivingAppsService.getSchichtdefinition(),
        LivingAppsService.getSchichtplanung(),
      ]);
      setMitarbeiter(mitarbeiterData);
      setSchichtdefinition(schichtdefinitionData);
      setSchichtplanung(schichtplanungData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [mitarbeiterData, schichtdefinitionData, schichtplanungData] = await Promise.all([
          LivingAppsService.getMitarbeiter(),
          LivingAppsService.getSchichtdefinition(),
          LivingAppsService.getSchichtplanung(),
        ]);
        setMitarbeiter(mitarbeiterData);
        setSchichtdefinition(schichtdefinitionData);
        setSchichtplanung(schichtplanungData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const mitarbeiterMap = useMemo(() => {
    const m = new Map<string, Mitarbeiter>();
    mitarbeiter.forEach(r => m.set(r.record_id, r));
    return m;
  }, [mitarbeiter]);

  const schichtdefinitionMap = useMemo(() => {
    const m = new Map<string, Schichtdefinition>();
    schichtdefinition.forEach(r => m.set(r.record_id, r));
    return m;
  }, [schichtdefinition]);

  return { mitarbeiter, setMitarbeiter, schichtdefinition, setSchichtdefinition, schichtplanung, setSchichtplanung, loading, error, fetchAll, mitarbeiterMap, schichtdefinitionMap };
}