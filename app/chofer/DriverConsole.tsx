'use client';

import { useState, useEffect, useTransition } from 'react';
import { updateDriverGPS, updateStopStatus, updateStopETA } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Phone, Check, X, AlertTriangle, Play, CheckCircle2, DollarSign, Clock, RefreshCw, LogOut } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { signOut } from 'next-auth/react';

interface Stop {
  id: string;
  sequence: number;
  type: 'PICKUP_PROVIDER' | 'DELIVERY_CUSTOMER';
  address: string;
  latitude: number | null;
  longitude: number | null;
  contactName: string;
  contactPhone: string;
  details: string;
  paymentStatus: 'PAID' | 'COLLECT';
  amountToCollect: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  failedReason: string | null;
  eta: string | null;
}

interface Route {
  id: string;
  status: string;
  startAddress: string;
  stops: Stop[];
}

export default function DriverConsole({
  driverId,
  driverName,
  driverRole,
  initialRoute,
}: {
  driverId: string;
  driverName: string;
  driverRole: string;
  initialRoute: Route | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [gpsStatus, setGpsStatus] = useState<'ACTIVE' | 'ERROR' | 'CHECKING'>('CHECKING');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [failingStopId, setFailingStopId] = useState<string | null>(null);
  const [failedReason, setFailedReason] = useState('');
  const [updatingEtaStopId, setUpdatingEtaStopId] = useState<string | null>(null);
  const [etaMinutes, setEtaMinutes] = useState('15');
  const [completingStop, setCompletingStop] = useState<{ id: string; amount: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'>('EFECTIVO');

  // GPS Broadcaster: Obtener y transmitir ubicación periódicamente
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsStatus('ERROR');
      return;
    }

    let watchId: any = null;

    const transmitLocation = (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setCoords({ lat, lng });
      setGpsStatus('ACTIVE');

      // Transmitir al servidor de forma silenciosa
      startTransition(async () => {
        try {
          await updateDriverGPS(driverId, lat, lng);
        } catch (e) {
          console.error('Error al transmitir GPS:', e);
        }
      });
    };

    const startWatching = (highAccuracy: boolean) => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }

      watchId = navigator.geolocation.watchPosition(
        transmitLocation,
        (err) => {
          console.warn(`GPS watchPosition error (highAccuracy=${highAccuracy}):`, err.message);
          
          if (highAccuracy && (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE)) {
            console.log('Fallando GPS alta precisión. Cambiando a baja precisión...');
            startWatching(false);
          } else if (err.code === err.PERMISSION_DENIED) {
            setGpsStatus('ERROR');
          }
        },
        {
          enableHighAccuracy: highAccuracy,
          maximumAge: 10000, // Permitir caché de 10 segundos
          timeout: 20000,    // Tiempo de espera de 20 segundos
        }
      );
    };

    // Solicitar ubicación inicial para pedir permisos de forma ordenada
    navigator.geolocation.getCurrentPosition(
      (position) => {
        transmitLocation(position);
        // Permiso concedido, iniciar watch continuo de alta precisión
        startWatching(true);
      },
      (err) => {
        console.warn('GPS initial getCurrentPosition error:', err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('ERROR');
        } else {
          // Si falló por timeout u otro motivo, de todos modos intentamos iniciar watch de baja precisión
          startWatching(false);
        }
      },
      {
        enableHighAccuracy: false, // Más rápido y con mayor tasa de éxito en interiores
        timeout: 10000,
      }
    );

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [driverId]);

  const handleCompleteStopClick = (stop: Stop) => {
    if (stop.paymentStatus === 'COLLECT' && stop.amountToCollect > 0) {
      setCompletingStop({ id: stop.id, amount: stop.amountToCollect });
      setFailingStopId(null);
      setUpdatingEtaStopId(null);
    } else {
      handleCompleteStopSubmit(stop.id);
    }
  };

  const handleCompleteStopSubmit = (stopId: string, method?: string) => {
    startTransition(async () => {
      try {
        const result = await updateStopStatus(stopId, 'COMPLETED', undefined, method);
        if (result.success) {
          setCompletingStop(null);
          router.refresh();
        }
      } catch (err: any) {
        alert('Error al completar parada: ' + err.message);
      }
    });
  };

  const handleFailStopSubmit = (stopId: string) => {
    if (!failedReason.trim()) return;

    startTransition(async () => {
      try {
        const result = await updateStopStatus(stopId, 'FAILED', failedReason);
        if (result.success) {
          setFailingStopId(null);
          setFailedReason('');
          router.refresh();
        }
      } catch (err: any) {
        alert('Error al registrar incidencia: ' + err.message);
      }
    });
  };

  const handleUpdateEtaSubmit = (stopId: string) => {
    const mins = parseInt(etaMinutes);
    if (isNaN(mins) || mins <= 0) return;

    startTransition(async () => {
      try {
        const result = await updateStopETA(stopId, mins);
        if (result.success) {
          setUpdatingEtaStopId(null);
          router.refresh();
        }
      } catch (err: any) {
        alert('Error al guardar ETA: ' + err.message);
      }
    });
  };

  const stops = initialRoute?.stops || [];
  const completedStops = stops.filter((s) => s.status !== 'PENDING').length;
  const totalStops = stops.length;
  const progressPercent = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  return (
    <div className="space-y-4 flex-grow flex flex-col">
      {/* Header móvil client-side */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-4 mb-2">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Ruta de Reparto</h1>
          <p className="text-xs text-slate-400">Chofer: {driverName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-brand-600 px-2.5 py-0.5 rounded-full text-white font-bold uppercase tracking-wider">
            {driverRole === 'DRIVER' ? 'Chofer' : driverRole || 'Repartidor'}
          </span>
          <button
            onClick={async () => {
              const url = new URL('/login', window.location.origin);
              url.searchParams.set('callbackUrl', '/');
              const targetUrl = url.toString();
              await signOut({ redirect: false, callbackUrl: targetUrl });
              window.location.href = targetUrl;
            }}
            className="p-1.5 bg-red-950/30 border border-red-900/40 text-red-400 rounded-lg hover:bg-red-900/50 transition-all flex items-center justify-center"
            title="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* GPS Status Indicator */}
      <div className={cn(
        "p-3 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-sm transition-all",
        gpsStatus === 'ACTIVE' 
          ? "bg-green-950/40 text-green-400 border-green-900/60" 
          : gpsStatus === 'ERROR' 
            ? "bg-red-950/40 text-red-400 border-red-900/60" 
            : "bg-slate-950/40 text-slate-400 border-slate-800"
      )}>
        <span className="flex items-center gap-1.5">
          <span className={cn("w-2 h-2 rounded-full", gpsStatus === 'ACTIVE' ? "bg-green-400 animate-ping" : "bg-red-400")} />
          {gpsStatus === 'ACTIVE' ? 'GPS Activo: Transmitiendo ubicación' : gpsStatus === 'ERROR' ? 'Señal GPS desactivada o denegada' : 'Buscando GPS...'}
        </span>
        {coords && (
          <span className="text-[10px] text-slate-500 font-mono">
            {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </span>
        )}
      </div>

      {/* GPS Error Alert */}
      {gpsStatus === 'ERROR' && (
        <div className="bg-red-950/20 text-red-400 border border-red-900/40 p-4 rounded-xl text-xs space-y-1.5 animate-in fade-in slide-in-from-top-1">
          <p className="font-bold flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-red-500" />
            Permiso de Ubicación Requerido
          </p>
          <p className="text-[11px] text-slate-300 leading-normal">
            Para que el despacho pueda ver tu posición en el mapa, es necesario dar acceso al GPS. 
            Por favor, presiona el icono de <strong>candado</strong> en la barra de direcciones de tu navegador, selecciona <strong>Permitir ubicación</strong> y recarga la página.
          </p>
        </div>
      )}

      {stops.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <Navigation size={48} className="text-slate-700 mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-white">Sin ruta asignada</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-xs">
            No tienes ninguna ruta de entrega activa en este momento. Ponte en contacto con el despacho para que te asigne pedidos.
          </p>
          <button
            onClick={() => router.refresh()}
            className="mt-6 py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={14} />
            Verificar nuevamente
          </button>
        </div>
      ) : (
        <>
          {/* Progress Card */}
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-4 shadow-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-300">Progreso de la Ruta</span>
              <span className="text-xs font-black text-white">{completedStops} / {totalStops} Paradas</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
              <div
                className="bg-brand-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              <strong>Punto de Partida:</strong> {initialRoute?.startAddress || 'Nuestra Sucursal'}
            </p>
          </div>

          {/* Stops list */}
          <div className="space-y-4 flex-1">
            {stops.map((stop) => {
              const isPickup = stop.type === 'PICKUP_PROVIDER';
              const isPendingStop = stop.status === 'PENDING';
              const isCompleted = stop.status === 'COMPLETED';
              const isFailed = stop.status === 'FAILED';

              return (
                <div
                  key={stop.id}
                  className={cn(
                    "border rounded-xl overflow-hidden shadow-sm transition-all bg-[#1e293b]",
                    isCompleted 
                      ? "border-green-900/40 opacity-70 bg-slate-900/60" 
                      : isFailed 
                        ? "border-red-900/40 opacity-70 bg-slate-900/60" 
                        : isPickup 
                          ? "border-amber-900/30" 
                          : "border-slate-800"
                  )}
                >
                  {/* Stop Header */}
                  <div className="p-4 flex items-start justify-between gap-3 border-b border-slate-800/40">
                    <div className="flex items-start gap-2.5">
                      <span className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border-2",
                        isCompleted 
                          ? "bg-green-950 border-green-500 text-green-400" 
                          : isFailed 
                            ? "bg-red-950 border-red-500 text-red-400" 
                            : isPickup 
                              ? "bg-amber-950 border-amber-500 text-amber-400" 
                              : "bg-slate-950 border-slate-600 text-slate-300"
                      )}>
                        {isCompleted ? '✓' : isFailed ? '✕' : stop.sequence}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{stop.contactName}</h4>
                          <span className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase",
                            isPickup ? "bg-amber-950/60 text-amber-400" : "bg-purple-950/60 text-purple-400"
                          )}>
                            {isPickup ? 'Proveedor' : 'Cliente'}
                          </span>
                        </div>
                        {stop.contactPhone && stop.contactPhone !== '—' && (
                          <a
                            href={`tel:${stop.contactPhone}`}
                            className="text-xs text-brand-400 hover:underline flex items-center gap-1 mt-1"
                          >
                            <Phone size={12} />
                            {stop.contactPhone}
                          </a>
                        )}
                      </div>
                    </div>

                    {stop.eta && isPendingStop && (
                      <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                        <Clock size={10} />
                        ETA: {new Date(stop.eta).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {/* Stop Body */}
                  <div className="p-4 space-y-3">
                    {/* Address */}
                    <div className="flex items-start gap-1.5">
                      <MapPin size={16} className="text-slate-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-300 leading-tight">{stop.address}</p>
                    </div>

                    {/* Details / Products */}
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/40 text-xs">
                      <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-1">Artículos</p>
                      <p className="text-slate-200 font-semibold leading-relaxed">{stop.details}</p>
                    </div>

                    {/* Payment */}
                    {!isPickup && (
                      <div className={cn(
                        "p-2.5 rounded-lg text-xs font-bold border flex items-center justify-between",
                        stop.paymentStatus === 'PAID'
                          ? "bg-green-950/20 text-green-400 border-green-950"
                          : "bg-red-950/20 text-red-400 border-red-950"
                      )}>
                        <span className="flex items-center gap-1">
                          <DollarSign size={14} />
                          {stop.paymentStatus === 'PAID' ? 'YA PAGADO (No cobrar)' : 'PAGO CONTRA ENTREGA (Cobrar)'}
                        </span>
                        {stop.paymentStatus === 'COLLECT' && (
                          <span className="text-white text-sm font-black bg-red-800/60 px-2.5 py-0.5 rounded-md">
                            {formatCurrency(stop.amountToCollect)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Failed Reason display */}
                    {isFailed && stop.failedReason && (
                      <div className="p-3 bg-red-950/20 text-red-400 text-xs rounded-lg border border-red-950/40 flex items-start gap-1.5">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <p><strong>Incidencia:</strong> {stop.failedReason}</p>
                      </div>
                    )}

                    {/* Stop Actions (only for PENDING) */}
                    {isPendingStop && (
                      <div className="pt-2 flex flex-col gap-2">
                        {/* Navigation */}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                        >
                          <Navigation size={14} />
                          Navegar con Google Maps
                        </a>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleCompleteStopClick(stop)}
                            disabled={isPending}
                            className="py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Check size={14} />
                            {isPickup ? 'Recogido' : 'Entregado'}
                          </button>
                          <button
                            onClick={() => {
                              setFailingStopId(failingStopId === stop.id ? null : stop.id);
                              setUpdatingEtaStopId(null);
                              setCompletingStop(null);
                            }}
                            className="py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border border-red-900/40 transition-colors"
                          >
                            <X size={14} />
                            Reportar Fallo
                          </button>
                        </div>

                        {/* Inline Form: PAYMENT METHOD */}
                        {completingStop?.id === stop.id && (
                          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2 animate-in fade-in slide-in-from-top-1 text-left">
                            <label className="text-[10px] text-green-400 font-bold uppercase">Registrar cobro de {formatCurrency(stop.amountToCollect)}:</label>
                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setPaymentMethod('EFECTIVO')}
                                className={cn(
                                  "py-1.5 px-2 rounded-md font-bold text-[10px] border transition-all text-center",
                                  paymentMethod === 'EFECTIVO'
                                    ? "bg-green-600 border-green-500 text-white font-black"
                                    : "bg-slate-800 border-slate-700 text-slate-300"
                                )}
                              >
                                Efectivo
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaymentMethod('TARJETA')}
                                className={cn(
                                  "py-1.5 px-2 rounded-md font-bold text-[10px] border transition-all text-center",
                                  paymentMethod === 'TARJETA'
                                    ? "bg-green-600 border-green-500 text-white font-black"
                                    : "bg-slate-800 border-slate-700 text-slate-300"
                                )}
                              >
                                Tarjeta (MP)
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaymentMethod('TRANSFERENCIA')}
                                className={cn(
                                  "py-1.5 px-2 rounded-md font-bold text-[10px] border transition-all text-center",
                                  paymentMethod === 'TRANSFERENCIA'
                                    ? "bg-green-600 border-green-500 text-white font-black"
                                    : "bg-slate-800 border-slate-700 text-slate-300"
                                )}
                              >
                                Transfer
                              </button>
                            </div>
                            <div className="flex gap-2 pt-1.5">
                              <button
                                onClick={() => handleCompleteStopSubmit(stop.id, paymentMethod)}
                                disabled={isPending}
                                className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-bold"
                              >
                                Confirmar y Completar
                              </button>
                              <button
                                onClick={() => setCompletingStop(null)}
                                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-semibold"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ETA Update toggle */}
                        <button
                          onClick={() => {
                            setUpdatingEtaStopId(updatingEtaStopId === stop.id ? null : stop.id);
                            setFailingStopId(null);
                            setCompletingStop(null);
                          }}
                          className="text-center text-[10px] text-slate-500 hover:text-slate-300 font-semibold"
                        >
                          {stop.eta ? 'Actualizar estimación ETA' : 'Añadir estimación ETA (Tiempo de arribo)'}
                        </button>

                        {/* Inline Form: ETA */}
                        {updatingEtaStopId === stop.id && (
                          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2 animate-in fade-in slide-in-from-top-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase">Minutos para llegar:</label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={etaMinutes}
                                onChange={(e) => setEtaMinutes(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-xs text-white rounded-md p-1.5 flex-1"
                                min="1"
                              />
                              <button
                                onClick={() => handleUpdateEtaSubmit(stop.id)}
                                className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3 py-1.5 rounded-md"
                              >
                                OK
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Inline Form: INCIDENCE */}
                        {failingStopId === stop.id && (
                          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2 animate-in fade-in slide-in-from-top-1">
                            <label className="text-[10px] text-red-400 font-bold uppercase">Motivo del fallo:</label>
                            <textarea
                              placeholder="Escribe el motivo (ej. cliente no contesta...)"
                              value={failedReason}
                              onChange={(e) => setFailedReason(e.target.value)}
                              className="bg-slate-800 border-slate-700 text-xs text-white rounded-md p-2 w-full h-16 resize-none"
                              required
                            />
                            <button
                              onClick={() => handleFailStopSubmit(stop.id)}
                              disabled={!failedReason.trim()}
                              className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md"
                            >
                              Reportar Incidencia
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
