'use client';

import { useState, useTransition } from 'react';
import { checkQuoteStock, confirmQuoteFulfillment, updateQuoteSupplierStatus, completeFulfillment } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { Truck, Store, CheckCircle, AlertTriangle, Clock, MapPin, PackageCheck, ClipboardCheck } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

export default function QuoteFulfillmentCard({ quote }: { quote: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deliveryType, setDeliveryType] = useState<'WILL_CALL' | 'DELIVERY'>(
    (quote.deliveryType as 'WILL_CALL' | 'DELIVERY') || 'WILL_CALL'
  );
  const [address, setAddress] = useState(
    quote.deliveryAddress || quote.customer.address || ''
  );
  
  // Estados para el flujo de dos pasos: verificar stock primero
  const [stockCheckResult, setStockCheckResult] = useState<{
    checked: boolean;
    hasAllStock: boolean;
    missingItems: string[];
  } | null>(null);
  const [verifyFeedback, setVerifyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'>('EFECTIVO');

  const handleVerifyStock = () => {
    setVerifyFeedback(null);
    setFeedback(null);
    
    startTransition(async () => {
      try {
        const result = await checkQuoteStock(quote.id);
        if (result.success) {
          setStockCheckResult({
            checked: true,
            hasAllStock: result.stockStatus === 'IN_STOCK',
            missingItems: result.missingItems || [],
          });
          if (result.stockStatus === 'IN_STOCK') {
            setVerifyFeedback({
              type: 'success',
              message: '¡Todo el producto está disponible en inventario local! Listo para ser enviado o entregado de inmediato.',
            });
          } else {
            const now = new Date();
            const hours = now.getHours();
            const etaMsg = hours < 16 
              ? 'Llega el mismo día antes de las 4:00 PM.' 
              : 'Llega al día siguiente después de las 4:00 PM.';
            setVerifyFeedback({
              type: 'success',
              message: `Falta stock local para algunos artículos. Se requerirá pedir al proveedor. ${etaMsg}`,
            });
          }
        } else {
          setVerifyFeedback({
            type: 'error',
            message: result.error || 'Error al verificar stock.',
          });
        }
      } catch (err: any) {
        setVerifyFeedback({
          type: 'error',
          message: err?.message || 'Error inesperado al verificar stock.',
        });
      }
    });
  };

  const handleConfirmSale = () => {
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
            message: result.error || 'Error al procesar la confirmación de la venta.',
          });
        }
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: err?.message || 'Error inesperado al confirmar venta.',
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
        const result = await completeFulfillment(quote.id, paymentMethod);
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

  const hasItems = quote.items && quote.items.length > 0;

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

      {!hasItems ? (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-sm text-red-700 flex items-start gap-2.5">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="font-bold text-red-900">Cotización sin partidas</h4>
            <p className="text-xs mt-1">
              Se necesita mínimo un producto agregado a la cotización para poder verificar el stock y proceder con la venta.
            </p>
          </div>
        </div>
      ) : quote.status === 'PENDING' ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase block mb-2">
              Tipo de Entrega
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeliveryType('WILL_CALL');
                  setStockCheckResult(null);
                  setVerifyFeedback(null);
                }}
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
                onClick={() => {
                  setDeliveryType('DELIVERY');
                  setStockCheckResult(null);
                  setVerifyFeedback(null);
                }}
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
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setStockCheckResult(null);
                    setVerifyFeedback(null);
                  }}
                  className="w-full text-sm border-gray-200 rounded-lg pr-10 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Calle, Número, Colonia, C.P. Ciudad"
                  required={deliveryType === 'DELIVERY'}
                />
                <MapPin size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          )}

          {/* Paso 1: Botón de verificación */}
          <div className="pt-2">
            <button
              onClick={handleVerifyStock}
              disabled={isPending || (deliveryType === 'DELIVERY' && !address.trim())}
              className="w-full py-2.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ClipboardCheck size={18} />
              <span>{isPending ? 'Verificando existencias...' : 'Paso 1: Verificar Stock local'}</span>
            </button>
          </div>

          {/* Mostrar resultado del stock check */}
          {verifyFeedback && (
            <div className={cn(
              "p-4 border rounded-lg text-xs space-y-2 animate-in fade-in slide-in-from-top-2",
              verifyFeedback.type === 'success' 
                ? stockCheckResult?.hasAllStock 
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-red-50 border-red-200 text-red-800"
            )}>
              <div className="font-bold flex items-center gap-1.5 text-sm">
                {stockCheckResult?.hasAllStock ? (
                  <>
                    <CheckCircle size={16} className="text-green-600" />
                    <span>Existencia disponible</span>
                  </>
                ) : verifyFeedback.type === 'success' ? (
                  <>
                    <Clock size={16} className="text-amber-600" />
                    <span>Se requiere pedido a proveedor (Faltantes)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} className="text-red-600" />
                    <span>Error de verificación</span>
                  </>
                )}
              </div>
              <p className="leading-relaxed">{verifyFeedback.message}</p>
              
              {/* Tiempo de entrega estimado */}
              {verifyFeedback.type === 'success' && (
                <div className="mt-2.5 p-2.5 bg-white/60 rounded-lg border border-gray-150 text-xs animate-in fade-in">
                  <span className="font-bold text-gray-700 block mb-0.5">Tiempo de Entrega / Llegada Estimado:</span>
                  <p className={cn(
                    "font-semibold text-xs",
                    stockCheckResult?.hasAllStock ? "text-green-700" : "text-amber-700"
                  )}>
                    {(() => {
                      if (stockCheckResult?.hasAllStock) {
                        return "Envío o entrega inmediata (Disponible en stock local)";
                      } else {
                        const now = new Date();
                        const hours = now.getHours();
                        if (hours < 16) {
                          return "Mismo día (antes de las 4:00 PM)";
                        } else {
                          return "Al día siguiente (después de las 4:00 PM)";
                        }
                      }
                    })()}
                  </p>
                </div>
              )}

              {stockCheckResult && stockCheckResult.missingItems.length > 0 && (
                <div className="mt-2 pt-2 border-t border-amber-200/50">
                  <span className="font-bold block mb-1">Artículos sin stock suficiente:</span>
                  <ul className="list-disc pl-4 space-y-1">
                    {stockCheckResult.missingItems.map((item, idx) => (
                      <li key={idx} className="font-mono text-[11px]">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Paso 2: Botón de confirmación (solo si ya se verificó con éxito) */}
          {stockCheckResult?.checked && (
            <div className="pt-2 border-t border-gray-150 mt-4 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={handleConfirmSale}
                disabled={isPending}
                className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <PackageCheck size={18} />
                <span>Paso 2: Confirmar Venta y Reservar</span>
              </button>
            </div>
          )}
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
                    Este pedido no cuenta con existencias locales en &apos;partes&apos;. Requiere ser solicitado con el proveedor.
                  </p>
                  <p className="text-xs font-semibold text-amber-800 mt-1">
                    Tiempo de llegada estimado: {(() => {
                      const now = new Date();
                      const hours = now.getHours();
                      if (hours < 16) {
                        return "Mismo día (antes de las 4:00 PM)";
                      } else {
                        return "Al día siguiente (después de las 4:00 PM)";
                      }
                    })()}
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
              
              <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase block">
                  Método de Pago *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full text-xs border-gray-200 rounded-md focus:ring-brand-500 focus:border-brand-500 py-1.5"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA">Tarjeta</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                </select>
              </div>

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
