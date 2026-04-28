'use client';

import { useState } from 'react';
import { updateProjectStatus, completeProject } from '@/app/actions';
import { useRouter } from 'next/navigation';

const TRANSITIONS: Record<string, { label: string; next: string; variant: string }[]> = {
  OPEN:          [{ label: 'Iniciar', next: 'IN_PROGRESS', variant: 'btn-primary' }, { label: 'Esp. partes', next: 'WAITING_PARTS', variant: 'btn-secondary' }],
  WAITING_PARTS: [{ label: 'Reanudar', next: 'IN_PROGRESS', variant: 'btn-primary' }],
  IN_PROGRESS:   [{ label: 'Completar y descontar inventario', next: 'COMPLETED', variant: 'btn-primary' }, { label: 'En espera', next: 'WAITING_PARTS', variant: 'btn-secondary' }],
  COMPLETED:     [],
  CANCELLED:     [],
};

export default function ProjectActions({ projectId, currentStatus }: { projectId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const transitions = TRANSITIONS[currentStatus] ?? [];

  if (transitions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map((t) => (
        <form
          key={t.next}
          action={async (fd) => {
            setLoading(true);
            if (t.next === 'COMPLETED') {
              await completeProject(fd);
            } else {
              await updateProjectStatus(fd);
            }
            setLoading(false);
          }}
        >
          <input type="hidden" name="id" value={projectId} />
          <input type="hidden" name="status" value={t.next} />
          <button type="submit" disabled={loading} className={`${t.variant} text-sm py-1.5`}>
            {loading ? '...' : t.label}
          </button>
        </form>
      ))}
    </div>
  );
}
