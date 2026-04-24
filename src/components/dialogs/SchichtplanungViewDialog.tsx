import type { Schichtplanung, Mitarbeiter, Schichtdefinition } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface SchichtplanungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Schichtplanung | null;
  onEdit: (record: Schichtplanung) => void;
  mitarbeiterList: Mitarbeiter[];
  schichtdefinitionList: Schichtdefinition[];
}

export function SchichtplanungViewDialog({ open, onClose, record, onEdit, mitarbeiterList, schichtdefinitionList }: SchichtplanungViewDialogProps) {
  function getMitarbeiterDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return mitarbeiterList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  function getSchichtdefinitionDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return schichtdefinitionList.find(r => r.record_id === id)?.fields.schichtname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schichtplanung anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Datum</Label>
            <p className="text-sm">{formatDate(record.fields.datum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mitarbeiter</Label>
            <p className="text-sm">{getMitarbeiterDisplayName(record.fields.mitarbeiter_ref)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schicht</Label>
            <p className="text-sm">{getSchichtdefinitionDisplayName(record.fields.schicht_ref)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Arbeitsbereich / Station</Label>
            <p className="text-sm">{record.fields.arbeitsbereich ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Badge variant="secondary">{record.fields.status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.notizen ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}