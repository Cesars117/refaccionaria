'use client';

import { useState } from 'react';
import { updateQuoteStatus, deleteQuote } from '@/app/actions';

export default function QuoteActions({ quoteId, currentStatus }: { quoteId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  if (currentStatus !== 'PENDING') return null;

  return (
    <div className="flex gap-2">
      <form action={async (fd) => { setLoading(true); await updateQuoteStatus(fd); }}>
        <input type="hidden" name="id" value={quoteId} />
        <input type="hidden" name="status" value="SOLD" />
        <button type="submit" disabled={loading} className="btn-primary text-sm py-1.5">
          {loading ? '...' : 'Marcar vendida'}
        </button>
      </form>
      <form action={async (fd) => { setLoading(true); await updateQuoteStatus(fd); }}>
        <input type="hidden" name="id" value={quoteId} />
        <input type="hidden" name="status" value="CANCELLED" />
        <button type="submit" disabled={loading} className="btn-secondary text-sm py-1.5 text-red-600">
          {loading ? '...' : 'Cancelar'}
        </button>
      </form>
      <form action={async (fd) => { if (confirm('¿Eliminar esta cotización?')) { setLoading(true); await deleteQuote(fd); } }}>
        <input type="hidden" name="id" value={quoteId} />
        <button type="submit" disabled={loading} className="btn-secondary text-sm py-1.5 text-red-600">
          {loading ? '...' : 'Eliminar'}
        </button>
      </form>
    </div>
  );
}
