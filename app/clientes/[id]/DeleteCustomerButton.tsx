'use client';

import { useTransition } from 'react';
import { deleteCustomer } from '@/app/actions';

export default function DeleteCustomerButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('¿Eliminar permanentemente a este cliente? Esto borrará todas sus cotizaciones, flotas y registros asociados de forma definitiva.')) return;
    
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id);
      await deleteCustomer(fd);
    });
  };

  return (
    <form onSubmit={handleDelete}>
      <button 
        type="submit" 
        disabled={isPending}
        className="px-4 py-2 text-sm font-semibold bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 rounded-lg disabled:opacity-50 transition-all"
      >
        {isPending ? 'Eliminando...' : 'Eliminar Cliente'}
      </button>
    </form>
  );
}
