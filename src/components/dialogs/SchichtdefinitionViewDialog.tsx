import type { Schichtdefinition } from '@/types/app';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';

interface SchichtdefinitionViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Schichtdefinition | null;
  onEdit: (record: Schichtdefinition) => void;
}

export function SchichtdefinitionViewDialog({ open, onClose, record, onEdit }: SchichtdefinitionViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schichtdefinition anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schichtname</Label>
            <p className="text-sm">{record.fields.schichtname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kürzel</Label>
            <p className="text-sm">{record.fields.kuerzel ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schichtbeginn</Label>
            <p className="text-sm">{record.fields.schichtbeginn ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schichtende</Label>
            <p className="text-sm">{record.fields.schichtende ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schichttyp</Label>
            <Badge variant="secondary">{record.fields.schichttyp?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.schichtbeschreibung ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}