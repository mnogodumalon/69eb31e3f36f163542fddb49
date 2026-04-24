import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichSchichtplanung } from '@/lib/enrich';
import type { EnrichedSchichtplanung } from '@/types/enriched';
import type { Mitarbeiter, Schichtdefinition } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService, createRecordUrl, extractRecordId } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { IconAlertCircle, IconTool, IconRefresh, IconCheck, IconChevronLeft, IconChevronRight, IconPlus, IconPencil, IconTrash, IconUsers, IconCalendar, IconClock } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SchichtplanungDialog } from '@/components/dialogs/SchichtplanungDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { addDays, startOfWeek, format, isToday } from 'date-fns';
import { de } from 'date-fns/locale';

const APPGROUP_ID = '69eb31e3f36f163542fddb49';
const REPAIR_ENDPOINT = '/claude/build/repair';

const STATUS_COLORS: Record<string, string> = {
  geplant: 'bg-blue-100 text-blue-700 border-blue-200',
  bestaetigt: 'bg-green-100 text-green-700 border-green-200',
  abwesend: 'bg-red-100 text-red-700 border-red-200',
  vertreten: 'bg-amber-100 text-amber-700 border-amber-200',
};

const SCHICHTTYP_COLORS: Record<string, string> = {
  fruehschicht: 'bg-orange-50 border-orange-200',
  spaetschicht: 'bg-indigo-50 border-indigo-200',
  nachtschicht: 'bg-slate-100 border-slate-300',
  tagschicht: 'bg-sky-50 border-sky-200',
  sonderschicht: 'bg-purple-50 border-purple-200',
};

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export default function DashboardOverview() {
  const {
    mitarbeiter, schichtdefinition, schichtplanung,
    mitarbeiterMap, schichtdefinitionMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedSchichtplanung = enrichSchichtplanung(schichtplanung, { mitarbeiterMap, schichtdefinitionMap });

  const [weekOffset, setWeekOffset] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<EnrichedSchichtplanung | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedSchichtplanung | null>(null);
  const [prefillDate, setPrefillDate] = useState<string | undefined>(undefined);
  const [prefillMitarbeiter, setPrefillMitarbeiter] = useState<string | undefined>(undefined);
  const [filterMitarbeiterId, setFilterMitarbeiterId] = useState<string>('all');
  const [filterSchichttyp, setFilterSchichttyp] = useState<string>('all');

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const planungByDayAndMitarbeiter = useMemo(() => {
    const map = new Map<string, EnrichedSchichtplanung[]>();
    enrichedSchichtplanung.forEach(p => {
      if (!p.fields.datum) return;
      const mitId = extractRecordId(p.fields.mitarbeiter_ref) ?? 'unknown';
      const key = `${p.fields.datum}__${mitId}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return map;
  }, [enrichedSchichtplanung]);

  const planungByDay = useMemo(() => {
    const map = new Map<string, EnrichedSchichtplanung[]>();
    enrichedSchichtplanung.forEach(p => {
      if (!p.fields.datum) return;
      if (!map.has(p.fields.datum)) map.set(p.fields.datum, []);
      map.get(p.fields.datum)!.push(p);
    });
    return map;
  }, [enrichedSchichtplanung]);

  const visibleMitarbeiter = useMemo(() => {
    if (filterMitarbeiterId !== 'all') {
      return mitarbeiter.filter(m => m.record_id === filterMitarbeiterId);
    }
    // Only show mitarbeiter that have shifts in current week, or all if none
    const weekDayStrings = weekDays.map(d => format(d, 'yyyy-MM-dd'));
    const active = mitarbeiter.filter(m =>
      weekDayStrings.some(d => {
        const key = `${d}__${m.record_id}`;
        return planungByDayAndMitarbeiter.has(key);
      })
    );
    return active.length > 0 ? active : mitarbeiter;
  }, [mitarbeiter, filterMitarbeiterId, weekDays, planungByDayAndMitarbeiter]);

  const weekPlanung = useMemo(() => {
    const weekDayStrings = weekDays.map(d => format(d, 'yyyy-MM-dd'));
    return enrichedSchichtplanung.filter(p => p.fields.datum && weekDayStrings.includes(p.fields.datum));
  }, [enrichedSchichtplanung, weekDays]);

  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayShifts = planungByDay.get(today) ?? [];
    const confirmed = weekPlanung.filter(p => p.fields.status?.key === 'bestaetigt').length;
    const absent = weekPlanung.filter(p => p.fields.status?.key === 'abwesend').length;
    return { todayShifts: todayShifts.length, confirmed, absent, total: weekPlanung.length };
  }, [planungByDay, weekPlanung]);

  const handleOpenCreate = useCallback((date?: string, mitarbeiterId?: string) => {
    setEditRecord(null);
    setPrefillDate(date);
    setPrefillMitarbeiter(mitarbeiterId ? createRecordUrl(APP_IDS.MITARBEITER, mitarbeiterId) : undefined);
    setDialogOpen(true);
  }, []);

  const handleOpenEdit = useCallback((record: EnrichedSchichtplanung) => {
    setEditRecord(record);
    setPrefillDate(undefined);
    setPrefillMitarbeiter(undefined);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteSchichtplanungEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  }, [deleteTarget, fetchAll]);

  const statusOpt = LOOKUP_OPTIONS['schichtplanung']?.status ?? [];
  const schichttypOpt = LOOKUP_OPTIONS['schichtdefinition']?.schichttyp ?? [];

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Mitarbeiter"
          value={String(mitarbeiter.length)}
          description="Gesamt"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Heute"
          value={String(stats.todayShifts)}
          description="Schichten"
          icon={<IconCalendar size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Diese Woche"
          value={String(stats.confirmed)}
          description="Bestätigt"
          icon={<IconCheck size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Abwesend"
          value={String(stats.absent)}
          description="Diese Woche"
          icon={<IconClock size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Weekly Shift Planner */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(o => o - 1)}>
              <IconChevronLeft size={16} />
            </Button>
            <span className="font-semibold text-sm min-w-[160px] text-center">
              {format(weekStart, 'dd.', { locale: de })}–{format(addDays(weekStart, 6), 'dd. MMMM yyyy', { locale: de })}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(o => o + 1)}>
              <IconChevronRight size={16} />
            </Button>
            {weekOffset !== 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setWeekOffset(0)}>
                Heute
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Mitarbeiter */}
            <select
              className="text-xs h-8 rounded-lg border border-border bg-background px-2 pr-6 appearance-none cursor-pointer"
              value={filterMitarbeiterId}
              onChange={e => setFilterMitarbeiterId(e.target.value)}
            >
              <option value="all">Alle Mitarbeiter</option>
              {mitarbeiter.map(m => (
                <option key={m.record_id} value={m.record_id}>
                  {m.fields.vorname} {m.fields.nachname}
                </option>
              ))}
            </select>
            {/* Filter Schichttyp */}
            <select
              className="text-xs h-8 rounded-lg border border-border bg-background px-2 pr-6 appearance-none cursor-pointer"
              value={filterSchichttyp}
              onChange={e => setFilterSchichttyp(e.target.value)}
            >
              <option value="all">Alle Schichttypen</option>
              {schichttypOpt.map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
            <Button size="sm" className="h-8 gap-1" onClick={() => handleOpenCreate()}>
              <IconPlus size={14} className="shrink-0" />
              <span className="hidden sm:inline">Schicht planen</span>
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs w-36 bg-muted/20">
                  Mitarbeiter
                </th>
                {weekDays.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayPlanung = planungByDay.get(dateStr) ?? [];
                  const today = isToday(day);
                  return (
                    <th
                      key={dateStr}
                      className={`text-center px-1 py-2 font-medium text-xs w-[13%] ${today ? 'bg-primary/5' : 'bg-muted/20'}`}
                    >
                      <div className={`${today ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                        {format(day, 'EEE', { locale: de })}
                      </div>
                      <div className={`text-base font-bold mt-0.5 ${today ? 'text-primary' : 'text-foreground'}`}>
                        {format(day, 'd')}
                      </div>
                      {dayPlanung.length > 0 && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">{dayPlanung.length} Schicht{dayPlanung.length !== 1 ? 'en' : ''}</div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visibleMitarbeiter.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                    <IconUsers size={32} className="mx-auto mb-2 opacity-30" />
                    Keine Mitarbeiter vorhanden
                  </td>
                </tr>
              ) : (
                visibleMitarbeiter.map((ma, idx) => (
                  <MitarbeiterRow
                    key={ma.record_id}
                    mitarbeiter={ma}
                    weekDays={weekDays}
                    planungByDayAndMitarbeiter={planungByDayAndMitarbeiter}
                    schichtdefinitionMap={schichtdefinitionMap}
                    filterSchichttyp={filterSchichttyp}
                    onEdit={handleOpenEdit}
                    onDelete={setDeleteTarget}
                    onCreateForSlot={handleOpenCreate}
                    isEven={idx % 2 === 0}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 px-4 py-3 border-t border-border bg-muted/20">
          {statusOpt.map(o => (
            <div key={o.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`inline-block w-2.5 h-2.5 rounded-full border ${STATUS_COLORS[o.key] ?? 'bg-muted'}`} />
              {o.label}
            </div>
          ))}
        </div>
      </div>

      {/* Dialogs */}
      <SchichtplanungDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={async (fields) => {
          if (editRecord) {
            await LivingAppsService.updateSchichtplanungEntry(editRecord.record_id, fields);
          } else {
            await LivingAppsService.createSchichtplanungEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editRecord ? {
          ...editRecord.fields,
          datum: editRecord.fields.datum,
          mitarbeiter_ref: editRecord.fields.mitarbeiter_ref,
          schicht_ref: editRecord.fields.schicht_ref,
        } : prefillDate || prefillMitarbeiter ? {
          datum: prefillDate,
          mitarbeiter_ref: prefillMitarbeiter,
        } : undefined}
        mitarbeiterList={mitarbeiter}
        schichtdefinitionList={schichtdefinition}
        enablePhotoScan={AI_PHOTO_SCAN['Schichtplanung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Schichtplanung']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Schicht löschen"
        description={`Schicht von ${deleteTarget?.mitarbeiter_refName || 'Mitarbeiter'} am ${deleteTarget?.fields.datum ? formatDate(deleteTarget.fields.datum) : '—'} wirklich löschen?`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

interface MitarbeiterRowProps {
  mitarbeiter: Mitarbeiter;
  weekDays: Date[];
  planungByDayAndMitarbeiter: Map<string, EnrichedSchichtplanung[]>;
  schichtdefinitionMap: Map<string, Schichtdefinition>;
  filterSchichttyp: string;
  onEdit: (record: EnrichedSchichtplanung) => void;
  onDelete: (record: EnrichedSchichtplanung) => void;
  onCreateForSlot: (date: string, mitarbeiterId: string) => void;
  isEven: boolean;
}

function MitarbeiterRow({
  mitarbeiter: ma,
  weekDays,
  planungByDayAndMitarbeiter,
  schichtdefinitionMap,
  filterSchichttyp,
  onEdit,
  onDelete,
  onCreateForSlot,
  isEven,
}: MitarbeiterRowProps) {
  return (
    <tr className={`border-b border-border/50 ${isEven ? 'bg-background' : 'bg-muted/10'} hover:bg-accent/5 transition-colors`}>
      <td className="px-3 py-2 align-top">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">
              {(ma.fields.vorname?.[0] ?? '?')}{(ma.fields.nachname?.[0] ?? '')}
            </span>
          </div>
          <div className="min-w-0">
            <div className="font-medium text-xs truncate">{ma.fields.vorname} {ma.fields.nachname}</div>
            {ma.fields.abteilung && (
              <div className="text-[10px] text-muted-foreground truncate">{ma.fields.abteilung}</div>
            )}
          </div>
        </div>
      </td>
      {weekDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const key = `${dateStr}__${ma.record_id}`;
        const shifts = planungByDayAndMitarbeiter.get(key) ?? [];
        const filtered = filterSchichttyp === 'all'
          ? shifts
          : shifts.filter(s => {
            const schichtId = extractRecordId(s.fields.schicht_ref);
            if (!schichtId) return false;
            const schicht = schichtdefinitionMap.get(schichtId);
            return schicht?.fields.schichttyp?.key === filterSchichttyp;
          });
        const today = isToday(day);

        return (
          <td
            key={dateStr}
            className={`align-top px-1 py-1.5 text-center ${today ? 'bg-primary/5' : ''}`}
          >
            <div className="space-y-1">
              {filtered.map(shift => {
                const schichtId = extractRecordId(shift.fields.schicht_ref);
                const schicht = schichtId ? schichtdefinitionMap.get(schichtId) : undefined;
                const statusKey = shift.fields.status?.key ?? 'geplant';
                const schichttypKey = schicht?.fields.schichttyp?.key ?? '';
                const bgClass = SCHICHTTYP_COLORS[schichttypKey] ?? 'bg-muted/50 border-border';

                return (
                  <div
                    key={shift.record_id}
                    className={`rounded-lg border px-1.5 py-1 text-left cursor-pointer group ${bgClass}`}
                    onClick={() => onEdit(shift)}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[11px] truncate leading-tight">
                          {schicht?.fields.kuerzel ?? shift.schicht_refName ?? '—'}
                        </div>
                        {schicht?.fields.schichtbeginn && (
                          <div className="text-[10px] text-muted-foreground">
                            {schicht.fields.schichtbeginn}–{schicht.fields.schichtende ?? ''}
                          </div>
                        )}
                        {shift.fields.arbeitsbereich && (
                          <div className="text-[10px] text-muted-foreground truncate">{shift.fields.arbeitsbereich}</div>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          className="p-0.5 rounded hover:bg-black/10 transition-colors"
                          onClick={e => { e.stopPropagation(); onEdit(shift); }}
                          title="Bearbeiten"
                        >
                          <IconPencil size={10} />
                        </button>
                        <button
                          className="p-0.5 rounded hover:bg-red-100 text-red-500 transition-colors"
                          onClick={e => { e.stopPropagation(); onDelete(shift); }}
                          title="Löschen"
                        >
                          <IconTrash size={10} />
                        </button>
                      </div>
                    </div>
                    <div className={`mt-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium border ${STATUS_COLORS[statusKey] ?? 'bg-muted text-muted-foreground border-border'}`}>
                      {shift.fields.status?.label ?? 'Geplant'}
                    </div>
                  </div>
                );
              })}
              <button
                className="w-full rounded-lg border border-dashed border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors py-1 flex items-center justify-center"
                onClick={() => onCreateForSlot(dateStr, ma.record_id)}
                title="Schicht hinzufügen"
              >
                <IconPlus size={12} />
              </button>
            </div>
          </td>
        );
      })}
    </tr>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
