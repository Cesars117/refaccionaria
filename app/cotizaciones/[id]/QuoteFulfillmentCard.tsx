'use client';

import { useState, useTransition } from 'react';
import { confirmQuoteFulfillment, updateQuoteSupplierStatus, completeFulfillment } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { Truck, Store, CheckCircle, AlertTriangle, Clock, MapPin, PackageCheck, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QuoteFulfillmentCard({ quote }: { quote: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deliveryType, setDeliveryType] = useState<'WILL_CALL' | 'DELIVERY'>(
    (quote.deliveryType as 'WILL_CALL' | 'DELIVERY') || 'WILL_CALL'
  );
  const [address, setAddress] = useState(
    quote.deliveryAddress || quote.customer.address || ''
  );
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleVerifyAndConfirm = () => {
    setFeedback(null);
    const fd = new FormData();
    fd.append('id', quote.id);
    fd.append('deliveryType', deliveryType);
    fd.append('deliveryAddress', deliveryType === 'DELIVERY' ? address : '');

    startTransition(async () => {
      try {
        const result = await confirmQuoteFulfillment(fd);
        if (result.success) {
          if (result.stockStatus === 'IN_STOCK') {
            setFeedback({
              type: 'success',
              message: '¡Venta aprobada con éxito! Stock local descontado y reservado.',
            });
          } else {
            setFeedback({
              type: 'success',
              message: '¡Venta aprobada! Stock local insuficiente. Puesto en espera de proveedor.',
            });
          }
          router.refresh();
        } else {
          setFeedback({
            type: 'error',
            message: 'Error al procesar la confirmación.',
          });
        }
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: err?.message || 'Error inesperado.',
        });
      }
    });
  };

  const handleSupplierStatus = (status: 'ORDERED' | 'RECEIVED') => {
    setFeedback(null);
    const fd = new FormData();
    fd.append('id', quote.id);
    fd.append('supplierStatus', status);

    startTransition(async () => {
      try {
        const result = await updateQuoteSupplierStatus(fd);
        if (result.success) {
          setFeedback({
            type: 'success',
            message: status === 'ORDERED' ? 'Pedido solicitado a proveedor.' : 'Material recibido de proveedor.',
          });
          router.refresh();
        }
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: err?.message || 'Error al actualizar abasto.',
        });
      }
    });
  };

  const handleCompletePickup = () => {
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await completeFulfillment(quote.id);
        if (result.success) {
          setFeedback({
            type: 'success',
            message: 'Venta entregada y completada.',
          });
          router.refresh();
        }
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: err?.message || 'Error al completar.',
        });
      }
    });
  };

  const FULFILLMENT_LABELS: Record<string, { label: string; class: string; icon: any }> = {
    PENDING_STOCK_CHECK: { label: 'Por Verificar', class: 'bg-gray-100 text-gray-700 border-gray-200', icon: ClipboardCheck },
    AWAITING_STOCK: { label: 'Esperando Proveedor', class: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
    PENDING_PICKUP: { label: 'Listo para Recoger (Will-Call)', class: 'bg-blue-100 text-blue-800 border-blue-200', icon: Store },
    PENDING_DELIVERY: { label: 'Listo para Despacho', class: 'bg-purple-100 text-purple-800 border-purple-200', icon: Truck },
    COMPLETED: { label: 'Entregado / Completado', class: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
    CANCELLED: { label: 'Cancelado', class: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
  };

  const currentFulfill = FULFILLMENT_LABELS[quote.fulfillmentStatus] || {
    label: quote.fulfillmentStatus,
    class: 'bg-gray-100 text-gray-700',
    icon: ClipboardCheck,
  };

  const FulfillIcon = currentFulfill.icon;

  return (
    <div className="card p-6 border border-gray-200 shadow-sm bg-white rounded-xl mb-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">Método de Entrega y Existencias</h3>
          <p className="text-xs text-gray-500">Logística, control de stock y entrega final</p>
        </div>
        {quote.status !== 'PENDING' && (
          <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border", currentFulfill.class)}>
            <FulfillIcon size={14} />
            {currentFulfill.label}
          </span>
        )}
      </div>

      {feedback && (
        <div className={cn(
          "p-3 rounded-lg text-sm font-medium mb-4 text-center border",
          feedback.type === 'success' ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
        )}>
          {feedback.message}
        </div>
      )}

      {quote.status === 'PENDING' ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase block mb-2">
              Tipo de Entrega
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryType('WILL_CALL')}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 border rounded-lg font-semibold text-sm transition-all",
                  deliveryType === 'WILL_CALL'
                    ? "bg-brand-50 border-brand-600 text-brand-700 ring-2 ring-brand-100"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                <Store size={18} />
                <span>Will-Call (Recoger)</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType('DELIVERY')}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 border rounded-lg font-semibold text-sm transition-all",
                  deliveryType === 'DELIVERY'
                    ? "bg-brand-50 border-brand-600 text-brand-700 ring-2 ring-brand-100"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                <Truck size={18} />
                <span>Entrega a Domicilio</span>
              </button>
            </div>
          </div>

          {deliveryType === 'DELIVERY' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold text-gray-700 uppercase block mb-1">
                Dirección de Entrega
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-sm border-gray-200 rounded-lg pr-10 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Calle, Número, Colonia, C.P. Ciudad"
                  required={deliveryType === 'DELIVERY'}
                />
                <MapPin size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleVerifyAndConfirm}
              disabled={isPending || (deliveryType === 'DELIVERY' && !address.trim())}
              className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <PackageCheck size={18} />
              <span>{isPending ? 'Verificando e inventariando...' : 'Verificar Stock y Confirmar Venta'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg text-sm border border-gray-100">
            <p className="flex items-center gap-2 mb-1.5 text-gray-700 font-medium">
              <strong>Tipo de Entrega:</strong> 
              {quote.deliveryType === 'WILL_CALL' ? 'Recoger en Tienda (Will-Call)' : 'Entrega a Domicilio'}
            </p>
            {quote.deliveryType === 'DELIVERY' && (
              <p className="flex items-start gap-1.5 text-gray-600 text-xs">
                <MapPin size={14} className="text-gray-400 mt-0.5" />
                <span>{quote.deliveryAddress}</span>
              </p>
            )}
          </div>

          {/* Gestión del estado AWAITING_STOCK */}
          {quote.fulfillmentStatus === 'AWAITING_STOCK' && (
            <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">Falta existencias locales</h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Este pedido no cuenta con existencias locales en "partes". Requiere ser solicitado con el proveedor.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-100 flex gap-2">
                {quote.supplierStatus === 'NONE' && (
                  <button
                    onClick={() => handleSupplierStatus('ORDERED')}
                    disabled={isPending}
                    className="flex-1 py-2 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-md transition-colors"
                  >
                    Marcar como Solicitado al Proveedor
                  </button>
                )}
                {quote.supplierStatus === 'ORDERED' && (
                  <div className="flex flex-col gap-2 w-full">
                    <p className="text-xs font-semibold text-amber-800 italic flex items-center gap-1.5 mb-1">
                      <Clock size={12} />
                      Estado Proveedor: Solicitado (En espera de recolección/entrega)
                    </p>
                    <button
                      onClick={() => handleSupplierStatus('RECEIVED')}
                      disabled={isPending}
                      className="w-full py-2 px-3 text-xs bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-md transition-colors"
                    >
                      Marcar como Recibido de Proveedor
                    </button>
                  </div>
                )}
                {quote.supplierStatus === 'RECEIVED' && (
                  <p className="text-xs font-bold text-green-700">✓ Recibido de proveedor</p>
                )}
              </div>
            </div>
          )}

          {/* Gestión del estado PENDING_PICKUP */}
          {quote.fulfillmentStatus === 'PENDING_PICKUP' && (
            <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Store className="text-blue-600" size={18} />
                <h4 className="font-bold text-blue-900 text-sm">Listo para recoger en tienda</h4>
              </div>
              <p className="text-xs text-blue-700">
                El material ha sido apartado y está físicamente listo para que el cliente lo recoja en mostrador (Will-Call).
              </p>
              <button
                onClick={handleCompletePickup}
                disabled={isPending}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs transition-colors"
              >
                Completar Entrega (El cliente ya recogió)
              </button>
            </div>
          )}

          {/* Gestión del estado PENDING_DELIVERY */}
          {quote.fulfillmentStatus === 'PENDING_DELIVERY' && (
            <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Truck className="text-purple-600" size={18} />
                <h4 className="font-bold text-purple-900 text-sm">Listo para entrega a domicilio</h4>
              </div>
              <p className="text-xs text-purple-700">
                El stock ha sido reservado. Este pedido ya está disponible en el panel de despacho para ser asignado a una ruta de entrega con un chofer.
              </p>
            </div>
          )}

          {/* Gestión del estado COMPLETED */}
          {quote.fulfillmentStatus === 'COMPLETED' && (
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg flex items-center gap-2.5">
              <CheckCircle className="text-green-600 shrink-0" size={20} />
              <div>
                <h4 className="font-bold text-green-900 text-sm">Pedido Completado</h4>
                <p className="text-xs text-green-700 mt-0.5">El cliente ha recibido su mercancía y el flujo de venta ha finalizado.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
