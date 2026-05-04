'use client';

import { useState, useTransition } from 'react';
import { updateQuoteStatus, deleteQuote } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { Check, X, Trash2 } from 'lucide-react';

export default function QuoteActions({ quoteId, currentStatus }: { quoteId: string; currentStatus: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState<'SOLD' | 'CANCELLED' | 'DELETE' | null>(null);

  const handleAction = (status: string) => {
    const fd = new FormData();
    fd.append('id', quoteId);
    fd.append('status', status);
    startTransition(async () => {
      await updateQuoteStatus(fd);
      setShowConfirm(null);
      router.refresh();
    });
  };

  const handleDelete = () => {
    const fd = new FormData();
    fd.append('id', quoteId);
    startTransition(async () => {
      await deleteQuote(fd);
      router.refresh();
      router.push('/cotizaciones');
    });
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
        <span className="text-xs font-bold text-gray-700 uppercase">
          {showConfirm === 'DELETE' ? '¿Borrar todo?' : `¿Marcar como ${showConfirm === 'SOLD' ? 'VENDIDA' : 'CANCELADA'}?`}
        </span>
        <button 
          onClick={() => showConfirm === 'DELETE' ? handleDelete() : handleAction(showConfirm)}
          disabled={isPending}
          className="bg-brand-600 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-brand-700"
        >
          SÍ
        </button>
        <button 
          onClick={() => setShowConfirm(null)}
          className="bg-white border border-gray-200 text-gray-700 text-[10px] font-bold px-2 py-1 rounded hover:bg-gray-50"
        >
          NO
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {currentStatus === 'PENDING' && (
        <>
          <button 
            onClick={() => setShowConfirm('SOLD')}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 bg-green-600 hover:bg-green-700 border-none"
          >
            <Check size={14} /> Aprobar Venta
          </button>
          <button 
            onClick={() => setShowConfirm('CANCELLED')}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 text-red-600 border-red-100 hover:bg-red-50"
          >
            <X size={14} /> Cancelar
          </button>
        </>
      )}
      <button 
        onClick={() => setShowConfirm('DELETE')}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Eliminar cotización permanentemente"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
