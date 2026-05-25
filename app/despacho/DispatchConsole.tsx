'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { 
  createDeliveryRoute, 
  updateActiveRouteStops, 
  deleteDeliveryRoute, 
  updateStopStatus 
} from '@/app/actions';
import { useRouter } from 'next/navigation';
import { 
  Truck, 
  Store, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  MapPin, 
  Search, 
  Navigation, 
  User, 
  Map, 
  RefreshCw, 
  Check, 
  Printer, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Driver {
  id: string;
  name: string;
  role: string;
  latitude: number | null;
  longitude: number | null;
}

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  part: {
    sku: string;
    brand: string | null;
  };
}

interface Quote {
  id: string;
  quoteNumber: string;
  deliveryType: string;
  deliveryAddress: string | null;
  subtotal: number;
  total: number;
  customer: {
    name: string;
    phone: string;
    address: string | null;
  };
  items: QuoteItem[];
}

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
  completedAt: string | null;
  quote?: Quote;
}

interface ActiveRoute {
  id: string;
  status: string;
  startAddress: string;
  createdAt: string;
  driver: {
    id: string;
    name: string;
    role: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
  stops: Stop[];
}

const ROUTE_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0891b2'];

export default function DispatchConsole({
  initialDeliveries,
  initialPickups,
  drivers,
  initialActiveRoutes,
}: {
  initialDeliveries: Quote[];
  initialPickups: Quote[];
  drivers: Driver[];
  initialActiveRoutes: ActiveRoute[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pestaña del panel del centro: PLAN (nueva) vs TRACK (activas)
  const [plannerTab, setPlannerTab] = useState<'PLAN' | 'TRACK'>('PLAN');
  
  const [selectedDriverId, setSelectedDriverId] = useState(drivers[0]?.id || '');
  const [startAddress, setStartAddress] = useState('Av. Norte y Coahuila #58, Dolores Hidalgo, GTO (Nuestra Sucursal)');
  const [stops, setStops] = useState<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estado para la edición de las rutas activas
  const [activeRoutes, setActiveRoutes] = useState<ActiveRoute[]>(initialActiveRoutes);

  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Sincronizar estado local de rutas activas al recibir actualizaciones
  useEffect(() => {
    setActiveRoutes(initialActiveRoutes);
  }, [initialActiveRoutes]);

  // Cargar Leaflet CDN
  useEffect(() => {
    if ((window as any).L) {
      setMapLoaded(true);
      return;
    }

    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(cssLink);

    const jsScript = document.createElement('script');
    jsScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    jsScript.async = true;
    jsScript.onload = () => {
      setMapLoaded(true);
    };
    document.body.appendChild(jsScript);
  }, []);



  // Inicializar y actualizar elementos del mapa
  useEffect(() => {
    if (!mapLoaded || !(window as any).L) return;
 
    const L = (window as any).L;

    if (!mapRef.current) {
      mapRef.current = L.map('leaflet-map').setView([21.1561, -100.9308], 13); // Dolores Hidalgo
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }

    // Limpiar marcadores y líneas anteriores
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 1. Marcadores para Choferes
    drivers.forEach((driver) => {
      if (driver.latitude && driver.longitude) {
        const markerIcon = L.divIcon({
          className: 'custom-driver-icon',
          html: `<div class="w-9 h-9 bg-brand-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-white font-bold text-sm hover:scale-110 transition-transform">${driver.name.charAt(0)}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([driver.latitude, driver.longitude], { icon: markerIcon })
          .bindPopup(`
            <div class="p-1">
              <h4 class="font-bold text-sm text-gray-900">${driver.name}</h4>
              <p class="text-xs text-gray-500 font-semibold uppercase">${driver.role}</p>
              <div class="mt-2 text-[10px] text-gray-400">GPS: ${driver.latitude.toFixed(5)}, ${driver.longitude.toFixed(5)}</div>
            </div>
          `)
          .addTo(mapRef.current);

        markersRef.current.push(marker);
      }
    });

    // 2. Marcadores para pedidos SIN ASIGNAR (Círculos Blancos con borde oscuro)
    const unassignedStops = [
      ...initialDeliveries.map(d => ({ ...d, type: 'DELIVERY_CUSTOMER' })),
      ...initialPickups.map(p => ({ ...p, type: 'PICKUP_PROVIDER' }))
    ];

    unassignedStops.forEach((stop, index) => {
      // Coordenadas reales o mockeadas dispersas alrededor del centro
      const lat = (stop.customer as any)?.latitude || 21.1561 + (Math.sin(index) * 0.015);
      const lng = (stop.customer as any)?.longitude || -100.9308 + (Math.cos(index) * 0.015);

      const whiteIcon = L.divIcon({
        className: 'custom-unassigned-icon',
        html: `<div class="w-7 h-7 bg-white border-3 border-slate-800 rounded-full shadow-lg flex items-center justify-center text-slate-900 font-extrabold text-[10px] hover:scale-125 transition-all hover:bg-slate-100">${stop.quoteNumber.slice(-3)}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([lat, lng], { icon: whiteIcon })
        .bindPopup(`
          <div class="p-2 min-w-[150px]">
            <h4 class="font-bold text-xs text-gray-900">Pedido ${stop.quoteNumber}</h4>
            <p class="text-[10px] text-gray-600 mt-1">Cliente: ${stop.customer.name}</p>
            <p class="text-[10px] font-semibold text-brand-600 mt-1">${stop.type === 'DELIVERY_CUSTOMER' ? 'Entrega Cliente' : 'Recolección Proveedor'}</p>
            <button 
              onclick="window.addStopFromMap('${stop.id}', '${stop.type}')"
              class="mt-2.5 w-full py-1 bg-brand-600 hover:bg-brand-700 text-white text-[9px] font-bold rounded"
            >
              + Agregar a la Ruta
            </button>
          </div>
        `)
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });

    // 3. Marcadores y líneas para RUTAS ACTIVAS (Colores distintivos por ruta)
    activeRoutes.forEach((route, rIndex) => {
      const color = ROUTE_COLORS[rIndex % ROUTE_COLORS.length];
      const routeCoords: [number, number][] = [];

      route.stops.forEach((stop, sIndex) => {
        const lat = stop.latitude || 21.1561 + (rIndex * 0.005) + (Math.sin(sIndex) * 0.004);
        const lng = stop.longitude || -100.9308 + (rIndex * 0.005) + (Math.cos(sIndex) * 0.004);
        
        routeCoords.push([lat, lng]);

        const activeStopIcon = L.divIcon({
          className: 'custom-active-stop-icon',
          html: `<div class="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-black text-[9px]" style="background-color: ${color}">${stop.sequence}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([lat, lng], { icon: activeStopIcon })
          .bindPopup(`
            <div class="p-1">
              <h4 class="font-bold text-xs" style="color: ${color}">Ruta: ${route.driver?.name || 'Chofer'}</h4>
              <p class="text-[10px] text-gray-700 mt-1">Parada #${stop.sequence}: ${stop.contactName}</p>
              <p class="text-[9px] text-gray-400">${stop.address}</p>
              <p class="text-[9px] font-bold mt-1 uppercase text-slate-500">Estado: ${stop.status}</p>
            </div>
          `)
          .addTo(mapRef.current);

        markersRef.current.push(marker);
      });

      // Dibujar línea que conecta las paradas de esta ruta
      if (routeCoords.length > 1) {
        const polyline = L.polyline(routeCoords, {
          color: color,
          weight: 4,
          opacity: 0.8,
          dashArray: route.status === 'PENDING' ? '5, 8' : undefined
        }).addTo(mapRef.current);

        markersRef.current.push(polyline);
      }
    });

    // 4. Dibujar línea temporal para la ruta que se está planificando en el momento
    const planningCoords = stops
      .filter((s) => s.latitude && s.longitude)
      .map((s) => [s.latitude, s.longitude]);

    if (planningCoords.length > 1) {
      const planningPolyline = L.polyline(planningCoords, {
        color: '#dc2626', // Rojo para el planificador
        weight: 3,
        dashArray: '5, 8',
      }).addTo(mapRef.current);

      markersRef.current.push(planningPolyline);
    }
  }, [mapLoaded, drivers, stops, activeRoutes, initialDeliveries, initialPickups]);

  // Imprimir Nota de Venta / Pick Ticket
  const printStopTicket = (stop: any) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const ticketHtml = `
      <html>
        <head>
          <title>Nota de Venta - ${stop.quoteNumber || 'Ticket'}</title>
          <style>
            body { font-family: monospace; padding: 25px; color: #000; background-color: #fff; line-height: 1.4; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 12px; margin-bottom: 20px; }
            .details { margin-bottom: 20px; }
            .details table { width: 100%; border-collapse: collapse; }
            .details td { padding: 4px; font-size: 13px; }
            .items { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
            .items th, .items td { border-bottom: 1px solid #000; padding: 8px; text-align: left; font-size: 13px; }
            .total-section { text-align: right; margin-bottom: 30px; font-size: 14px; }
            .footer { border-top: 2px dashed #000; padding-top: 15px; text-align: center; margin-top: 40px; font-size: 11px; }
            .signature-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-top: 50px; }
            .signature-line { border-top: 1px solid #000; text-align: center; padding-top: 5px; font-size: 12px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="padding: 8px 16px; font-size: 12px; font-weight: bold; background-color: #111827; color: white; border: none; border-radius: 6px; cursor: pointer;">Imprimir Nota (Control-P)</button>
          </div>
          <div class="header">
            <h2>A/C RADIAMEX</h2>
            <p>Sistemas de Enfriamiento Automotriz</p>
            <p>Tel: +52 418 239 4907</p>
            <p>Av. Norte y Coahuila #58 Dolores Hidalgo, GTO.</p>
            <h3>TICKET DE DESPACHO / NOTA DE VENTA</h3>
          </div>
          <div class="details">
            <table>
              <tr>
                <td><b>Folio Cotización:</b> ${stop.quoteNumber || '—'}</td>
                <td><b>Fecha Emisión:</b> ${new Date().toLocaleDateString('es-MX')}</td>
              </tr>
              <tr>
                <td><b>Cliente:</b> ${stop.contactName}</td>
                <td><b>Teléfono:</b> ${stop.contactPhone}</td>
              </tr>
              <tr>
                <td colspan="2"><b>Dirección de Entrega:</b> ${stop.address}</td>
              </tr>
              <tr>
                <td><b>Tipo de Movimiento:</b> ${stop.type === 'PICKUP_PROVIDER' ? 'RECOLECCIÓN PROVEEDOR' : 'ENTREGA A DOMICILIO'}</td>
                <td><b>Estado de Pago:</b> ${stop.paymentStatus === 'PAID' ? 'PAGADO' : 'COBRAR AL ENTREGAR'}</td>
              </tr>
            </table>
          </div>
          <div class="details">
            <h4 style="margin-bottom: 5px;">Detalle de Mercancía:</h4>
            <div style="border: 1px solid #000; padding: 10px; background-color: #fafafa; font-size: 13px; white-space: pre-wrap;">${stop.details}</div>
          </div>
          ${stop.paymentStatus === 'COLLECT' ? `
            <div class="total-section">
              <h3>MONTO TOTAL A COBRAR EN DESTINO: $${stop.amountToCollect.toFixed(2)} MXN</h3>
            </div>
          ` : `
            <div class="total-section">
              <h3>ESTADO: YA PAGADO (DOCUMENTADO)</h3>
            </div>
          `}
          <div class="signature-grid">
            <div>
              <div style="height: 40px;"></div>
              <div class="signature-line">Firma Despacho / Chofer</div>
            </div>
            <div>
              <div style="height: 40px;"></div>
              <div class="signature-line">Firma de Recibido (Cliente)</div>
            </div>
          </div>
          <div class="footer">
            <p>¡Gracias por su preferencia!</p>
            <p>Soporte Logístico: soporte@radiamex.com</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(ticketHtml);
    printWindow.document.close();
  };

  function addStop(quote: Quote, type: 'PICKUP_PROVIDER' | 'DELIVERY_CUSTOMER') {
    if (stops.some((s) => s.quoteId === quote.id && s.type === type)) {
      return;
    }

    const itemsSummary = quote.items
      .map((i) => `${i.quantity}x ${i.description}`)
      .join(', ');

    const newStop = {
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      type,
      address: type === 'PICKUP_PROVIDER' 
        ? 'Bodega de Proveedor (Verificar documento)' 
        : quote.deliveryAddress || quote.customer.address || 'Sin dirección registrada',
      latitude: (quote.customer as any)?.latitude || 21.1561 + (Math.random() - 0.5) * 0.02,
      longitude: (quote.customer as any)?.longitude || -100.9308 + (Math.random() - 0.5) * 0.02,
      contactName: type === 'PICKUP_PROVIDER' ? 'Bodega Proveedor' : quote.customer.name,
      contactPhone: type === 'PICKUP_PROVIDER' ? '—' : quote.customer.phone,
      details: itemsSummary,
      paymentStatus: type === 'PICKUP_PROVIDER' ? 'PAID' : 'PAID',
      amountToCollect: 0,
    };

    setStops([...stops, newStop]);
  }

  // Puente para que los popups del mapa (HTML crudo) puedan invocar acciones de React
  useEffect(() => {
    (window as any).addStopFromMap = (quoteId: string, type: string) => {
      const quote = [...initialDeliveries, ...initialPickups].find((q) => q.id === quoteId);
      if (quote) {
        addStop(quote, type as any);
      }
    };
    return () => {
      delete (window as any).addStopFromMap;
    };
  }, [initialDeliveries, initialPickups, stops]);

  const removeStop = (index: number) => {
    const updated = [...stops];
    updated.splice(index, 1);
    setStops(updated);
  };

  const moveStop = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === stops.length - 1) return;

    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    const updated = [...stops];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setStops(updated);
  };

  // Reordenar paradas de una ruta activa en tiempo real
  const moveActiveStop = (routeId: string, stopIndex: number, direction: 'UP' | 'DOWN') => {
    const route = activeRoutes.find(r => r.id === routeId);
    if (!route) return;

    const stopsList = [...route.stops];
    if (direction === 'UP' && stopIndex === 0) return;
    if (direction === 'DOWN' && stopIndex === stopsList.length - 1) return;

    const targetIndex = direction === 'UP' ? stopIndex - 1 : stopIndex + 1;
    const temp = stopsList[stopIndex];
    stopsList[stopIndex] = stopsList[targetIndex];
    stopsList[targetIndex] = temp;

    // Actualizar secuencia
    stopsList.forEach((s, idx) => {
      s.sequence = idx + 1;
    });

    // Actualizar local
    const updatedRoutes = activeRoutes.map(r => r.id === routeId ? { ...r, stops: stopsList } : r);
    setActiveRoutes(updatedRoutes);

    // Guardar en DB en segundo plano
    startTransition(async () => {
      await updateActiveRouteStops(routeId, stopsList);
    });
  };

  // Eliminar una parada de una ruta activa en tiempo real
  const removeActiveStop = (routeId: string, stopId: string) => {
    const route = activeRoutes.find(r => r.id === routeId);
    if (!route) return;

    const stopsList = route.stops.filter(s => s.id !== stopId);
    stopsList.forEach((s, idx) => {
      s.sequence = idx + 1;
    });

    // Actualizar local
    const updatedRoutes = activeRoutes.map(r => r.id === routeId ? { ...r, stops: stopsList } : r);
    setActiveRoutes(updatedRoutes);

    startTransition(async () => {
      await updateActiveRouteStops(routeId, stopsList);
      router.refresh();
    });
  };

  // Guardar dirección modificada de la parada en la ruta activa
  const handleActiveStopFieldChange = (routeId: string, stopId: string, field: string, value: any) => {
    const route = activeRoutes.find(r => r.id === routeId);
    if (!route) return;

    const stopsList = route.stops.map(s => {
      if (s.id === stopId) {
        return { ...s, [field]: value };
      }
      return s;
    });

    // Actualizar local
    const updatedRoutes = activeRoutes.map(r => r.id === routeId ? { ...r, stops: stopsList } : r);
    setActiveRoutes(updatedRoutes);
  };

  const handleActiveStopsSave = (routeId: string) => {
    const route = activeRoutes.find(r => r.id === routeId);
    if (!route) return;

    startTransition(async () => {
      const result = await updateActiveRouteStops(routeId, route.stops);
      if (result.success) {
        setFeedback({
          type: 'success',
          message: 'Cambios en la ruta activa guardados y actualizados para el chofer.',
        });
        router.refresh();
      }
    });
  };

  const handleForceCompleteStop = (stopId: string) => {
    startTransition(async () => {
      const result = await updateStopStatus(stopId, 'COMPLETED');
      if (result.success) {
        setFeedback({
          type: 'success',
          message: 'Parada marcada como entregada.',
        });
        router.refresh();
      }
    });
  };

  const handleCancelRoute = (routeId: string) => {
    if (!confirm('¿Estás seguro de cancelar esta ruta por completo?')) return;

    startTransition(async () => {
      const result = await deleteDeliveryRoute(routeId);
      if (result.success) {
        setFeedback({
          type: 'success',
          message: 'Ruta activa cancelada y eliminada.',
        });
        router.refresh();
      }
    });
  };

  const handleDispatchRoute = () => {
    if (stops.length === 0) return;
    setFeedback(null);

    startTransition(async () => {
      try {
        const result = await createDeliveryRoute(selectedDriverId, stops, startAddress);
        if (result.success) {
          setStops([]);
          setFeedback({
            type: 'success',
            message: '¡Ruta despachada y enviada al chofer exitosamente!',
          });
          router.refresh();
        }
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: err?.message || 'Error al guardar la ruta.',
        });
      }
    });
  };

  const pendingList = activeTab === 'DELIVERY' ? initialDeliveries : initialPickups;

  const filteredPending = pendingList.filter(
    (q) =>
      q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Columna 1: Pedidos Disponibles */}
      <div className="card p-5 border border-gray-200 bg-white rounded-xl flex flex-col h-[820px]">
        <div className="border-b border-gray-100 pb-3 mb-4">
          <h3 className="font-bold text-gray-900 text-md">Pedidos por Despachar</h3>
          <p className="text-xs text-gray-500 mt-0.5">Selecciona cotizaciones confirmadas para agregar a la ruta</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => setActiveTab('DELIVERY')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'DELIVERY' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Truck size={14} />
            Entregas ({initialDeliveries.length})
          </button>
          <button
            onClick={() => setActiveTab('PICKUP')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'PICKUP' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Store size={14} />
            Abasto Proveedor ({initialPickups.length})
          </button>
        </div>

        {/* Buscador */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Buscar por folio o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 border-gray-200 rounded-lg focus:ring-brand-500 focus:border-brand-500"
          />
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Lista de Pedidos (Bolitas Blancas Mock) */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredPending.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-12">No hay pendientes en esta sección.</p>
          ) : (
            filteredPending.map((quote) => (
              <div
                key={quote.id}
                className="p-3 border border-gray-100 rounded-lg hover:border-brand-300 hover:bg-slate-50/50 transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  {/* Círculo Blanco */}
                  <span className="w-5 h-5 bg-white border-2 border-slate-700 text-slate-800 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                    {quote.quoteNumber.slice(-3)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-gray-900">{quote.quoteNumber}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 truncate mt-0.5">{quote.customer.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{quote.deliveryAddress || quote.customer.address || 'Sin dirección'}</p>
                    <p className="text-[9px] font-medium text-brand-600 mt-1 truncate">{quote.items.map(i => `${i.quantity}x ${i.part.sku}`).join(', ')}</p>
                  </div>
                </div>
                <button
                  onClick={() => addStop(quote, activeTab === 'DELIVERY' ? 'DELIVERY_CUSTOMER' : 'PICKUP_PROVIDER')}
                  className="bg-brand-50 text-brand-700 p-1.5 rounded-lg border border-brand-100 group-hover:bg-brand-600 group-hover:text-white transition-colors"
                  title="Agregar parada a la ruta"
                >
                  <Plus size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Columna 2: Planificador de Ruta (Tabs: PLAN vs TRACK) */}
      <div className="card p-5 border border-gray-200 bg-white rounded-xl flex flex-col h-[820px]">
        {/* Tabs del Planificador */}
        <div className="flex border-b border-gray-200 pb-3 mb-4 justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setPlannerTab('PLAN')}
              className={`px-3 py-1 text-xs font-bold rounded-md ${
                plannerTab === 'PLAN' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-900 bg-gray-50'
              }`}
            >
              Planificar Nueva
            </button>
            <button
              onClick={() => setPlannerTab('TRACK')}
              className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 ${
                plannerTab === 'TRACK' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-900 bg-gray-50'
              }`}
            >
              Rutas Activas ({activeRoutes.length})
            </button>
          </div>
          <p className="text-[10px] text-gray-400 font-medium">Fase 2</p>
        </div>

        {feedback && (
          <div className={`p-2.5 rounded-lg text-xs font-medium mb-3 text-center border ${
            feedback.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {feedback.message}
          </div>
        )}

        {plannerTab === 'PLAN' ? (
          <div className="flex-grow flex flex-col min-h-0">
            {/* Chofer Dropdown */}
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-700 uppercase block mb-1">
                Asignar a Chofer
              </label>
              <div className="relative">
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full text-xs border-gray-200 rounded-lg pl-8 focus:ring-brand-500 focus:border-brand-500"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.role === 'DRIVER' ? 'Chofer' : d.role})
                    </option>
                  ))}
                </select>
                <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Punto de Partida */}
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-700 uppercase block mb-1">
                Punto de Inicio de Ruta
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={startAddress}
                  onChange={(e) => setStartAddress(e.target.value)}
                  className="w-full text-xs border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Ej: Av. Norte y Coahuila #58, Dolores Hidalgo, GTO o Bodega Proveedor"
                />
                <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="flex gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setStartAddress('Av. Norte y Coahuila #58, Dolores Hidalgo, GTO (Nuestra Sucursal)')}
                  className="text-[9px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded transition-all"
                >
                  Nuestra Sucursal
                </button>
                <button
                  type="button"
                  onClick={() => setStartAddress('Bodega del Proveedor')}
                  className="text-[9px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded transition-all"
                >
                  Bodega Proveedor
                </button>
              </div>
            </div>

            {/* Lista de Paradas Secuenciales */}
            <div className="flex-grow overflow-y-auto space-y-3 pr-1 mb-4">
              {stops.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-6 border-2 border-dashed border-gray-200 rounded-lg">
                  <Navigation size={32} className="text-gray-300 mb-2 animate-pulse" />
                  <p className="text-xs font-bold text-gray-500">Ruta Vacía</p>
                  <p className="text-[10px] text-gray-400 mt-1">Presiona el botón &apos;+&apos; o haz clic en las bolitas blancas del mapa.</p>
                </div>
              ) : (
                stops.map((stop, index) => {
                  const isPickup = stop.type === 'PICKUP_PROVIDER';
                  return (
                    <div
                      key={`${stop.quoteId}-${stop.type}`}
                      className="p-3 border border-brand-100 bg-brand-50/20 rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${
                            isPickup ? 'bg-amber-500 text-white' : 'bg-purple-600 text-white'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-gray-900 truncate">{stop.quoteNumber}</span>
                            </div>
                            <p className="text-xs text-gray-700 font-semibold truncate">{stop.contactName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveStop(index, 'UP')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => moveStop(index, 'DOWN')}
                            disabled={index === stops.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            onClick={() => removeStop(index)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Dirección editable */}
                      <div>
                        <label className="text-[9px] text-gray-400 font-bold block mb-0.5 uppercase">Dirección de parada</label>
                        <input
                          type="text"
                          value={stop.address}
                          onChange={(e) => {
                            const updated = [...stops];
                            updated[index].address = e.target.value;
                            setStops(updated);
                          }}
                          className="w-full text-xs p-1 border border-gray-200 rounded"
                        />
                      </div>

                      {/* Configuración de Pago */}
                      {!isPickup && (
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-0.5 uppercase">Pago</label>
                            <select
                              value={stop.paymentStatus}
                              onChange={(e) => {
                                const updated = [...stops];
                                updated[index].paymentStatus = e.target.value;
                                setStops(updated);
                              }}
                              className="text-xs p-1 border border-gray-200 rounded w-full bg-white"
                            >
                              <option value="PAID">Pagado</option>
                              <option value="COLLECT">Cobro contra entrega</option>
                            </select>
                          </div>
                          {stop.paymentStatus === 'COLLECT' && (
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold block mb-0.5 uppercase">Monto ($)</label>
                              <input
                                type="number"
                                value={stop.amountToCollect}
                                onChange={(e) => {
                                  const updated = [...stops];
                                  updated[index].amountToCollect = parseFloat(e.target.value) || 0;
                                  setStops(updated);
                                }}
                                className="text-xs p-1 border border-gray-200 rounded w-full"
                                placeholder="Total"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Despachar botón */}
            <div>
              <button
                onClick={handleDispatchRoute}
                disabled={isPending || stops.length === 0}
                className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Navigation size={16} />
                <span>{isPending ? 'Guardando...' : 'Crear y Despachar Ruta'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* PESTAÑA: Rutas Activas (Edición en tiempo real) */
          <div className="flex-grow overflow-y-auto space-y-4 pr-1 min-h-0">
            {activeRoutes.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-12">No hay rutas activas en este momento.</p>
            ) : (
              activeRoutes.map((route, rIndex) => {
                const color = ROUTE_COLORS[rIndex % ROUTE_COLORS.length];
                const completed = route.stops.filter(s => s.status !== 'PENDING').length;
                const total = route.stops.length;
                
                return (
                  <div key={route.id} className="border border-gray-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                          <h4 className="font-bold text-xs text-gray-800">{route.driver?.name || 'Chofer'}</h4>
                        </div>
                        <p className="text-[10px] text-gray-400">{completed} / {total} paradas completadas</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleActiveStopsSave(route.id)}
                          className="px-2 py-1 bg-green-600 text-white text-[9px] font-bold rounded hover:bg-green-700 flex items-center gap-0.5"
                          title="Guardar cambios de secuencia/dirección"
                        >
                          <Check size={10} /> Guardar
                        </button>
                        <button
                          onClick={() => handleCancelRoute(route.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Eliminar ruta completa"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Paradas de la ruta activa */}
                    <div className="space-y-2">
                      {route.stops.map((stop, sIndex) => {
                        const isPendingStop = stop.status === 'PENDING';
                        return (
                          <div key={stop.id} className="bg-white border border-gray-100 rounded-lg p-2.5 space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full text-white font-bold text-[9px] flex items-center justify-center shrink-0" style={{ backgroundColor: color }}>
                                  {stop.sequence}
                                </span>
                                <div>
                                  <h5 className="font-bold text-[11px] text-gray-900 truncate">{stop.contactName}</h5>
                                  <span className="text-[8px] font-semibold text-gray-400 uppercase">{stop.status}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {isPendingStop && (
                                  <>
                                    <button
                                      onClick={() => moveActiveStop(route.id, sIndex, 'UP')}
                                      disabled={sIndex === 0}
                                      className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                    >
                                      <ArrowUp size={12} />
                                    </button>
                                    <button
                                      onClick={() => moveActiveStop(route.id, sIndex, 'DOWN')}
                                      disabled={sIndex === route.stops.length - 1}
                                      className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                    >
                                      <ArrowDown size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleForceCompleteStop(stop.id)}
                                      className="px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-200 text-[8px] font-bold rounded"
                                    >
                                      Entregado
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => printStopTicket(stop)}
                                  className="p-0.5 text-gray-400 hover:text-brand-600"
                                  title="Imprimir ticket de despacho"
                                >
                                  <Printer size={12} />
                                </button>
                                {isPendingStop && (
                                  <button
                                    onClick={() => removeActiveStop(route.id, stop.id)}
                                    className="p-0.5 text-gray-450 hover:text-red-650"
                                    title="Quitar parada"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Editar dirección activa en tiempo real */}
                            {isPendingStop && (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={stop.address}
                                  onChange={(e) => handleActiveStopFieldChange(route.id, stop.id, 'address', e.target.value)}
                                  className="w-full text-[10px] p-1 border border-gray-150 rounded"
                                  placeholder="Dirección alterna"
                                />
                                <div className="grid grid-cols-2 gap-1.5">
                                  <select
                                    value={stop.paymentStatus}
                                    onChange={(e) => handleActiveStopFieldChange(route.id, stop.id, 'paymentStatus', e.target.value)}
                                    className="text-[9px] p-1 border border-gray-150 rounded bg-white"
                                  >
                                    <option value="PAID">Pagado</option>
                                    <option value="COLLECT">Cobrar en destino</option>
                                  </select>
                                  {stop.paymentStatus === 'COLLECT' && (
                                    <input
                                      type="number"
                                      value={stop.amountToCollect}
                                      onChange={(e) => handleActiveStopFieldChange(route.id, stop.id, 'amountToCollect', parseFloat(e.target.value) || 0)}
                                      className="text-[9px] p-1 border border-gray-150 rounded"
                                      placeholder="Monto"
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Columna 3: Seguimiento GPS y Mapa */}
      <div className="card p-5 border border-gray-200 bg-white rounded-xl flex flex-col h-[820px]">
        <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-md">Seguimiento en Tiempo Real</h3>
            <p className="text-xs text-gray-500 mt-0.5 font-sans">Ubicación GPS de choferes activos</p>
          </div>
          <button
            onClick={() => router.refresh()}
            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-all"
            title="Refrescar ubicación"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Mapa Leaflet Container */}
        <div className="flex-1 rounded-lg border border-gray-200 overflow-hidden bg-slate-50 relative mb-4">
          <div id="leaflet-map" className="w-full h-full z-10" />
          {!mapLoaded && (
            <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center text-center p-6 z-20">
              <Map size={36} className="text-gray-300 mb-2 animate-bounce" />
              <p className="text-xs font-bold text-gray-500">Cargando Mapa GPS...</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Estableciendo conexión satelital y cargando OpenStreetMap</p>
            </div>
          )}
        </div>

        {/* Lista de Choferes */}
        <div className="h-44 overflow-y-auto space-y-2 pr-1 border-t border-gray-100 pt-3">
          <h4 className="text-xs font-bold text-gray-700 uppercase block mb-1">Estatus de Choferes</h4>
          {drivers.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-6">No hay choferes configurados.</p>
          ) : (
            drivers.map((driver) => {
              const hasGps = !!(driver.latitude && driver.longitude);
              return (
                <div
                  key={driver.id}
                  className="flex items-center justify-between p-2 rounded-lg border border-gray-50 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${hasGps ? 'bg-green-500 animate-pulse' : 'bg-gray-350'}`} />
                    <div>
                      <p className="text-xs font-bold text-gray-800">{driver.name}</p>
                      <p className="text-[9px] text-gray-500 font-semibold uppercase">{driver.role}</p>
                    </div>
                  </div>
                  {hasGps ? (
                    <span className="text-[9px] bg-green-50 text-green-700 border border-green-100 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Navigation size={10} className="rotate-45" />
                      GPS Activo
                    </span>
                  ) : (
                    <span className="text-[9px] bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
                      Sin señal GPS
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
