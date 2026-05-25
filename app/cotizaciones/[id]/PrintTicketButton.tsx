'use client';

import { Printer } from 'lucide-react';

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  part?: {
    sku: string | null;
  };
}

interface Quote {
  id: string;
  quoteNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  deliveryType: string;
  deliveryAddress: string | null;
  status: string;
  createdAt: string | Date;
  customer: {
    name: string;
    phone: string;
    address: string | null;
  };
  items: QuoteItem[];
}

export default function PrintTicketButton({ quote }: { quote: Quote }) {
  const printTicket = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const itemsSummary = quote.items
      .map((i) => `${i.quantity}x ${i.description} (SKU: ${i.part?.sku || '—'}) - $${i.unitPrice.toFixed(2)} c/u`)
      .join('\n');

    const ticketHtml = `
      <html>
        <head>
          <title>Nota de Venta - ${quote.quoteNumber || 'Ticket'}</title>
          <style>
            body { font-family: monospace; padding: 25px; color: #000; background-color: #fff; line-height: 1.4; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 12px; margin-bottom: 20px; }
            .details { margin-bottom: 20px; }
            .details table { width: 100%; border-collapse: collapse; }
            .details td { padding: 4px; font-size: 13px; }
            .footer { border-top: 2px dashed #000; padding-top: 15px; text-align: center; margin-top: 40px; font-size: 11px; }
            .signature-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-top: 50px; }
            .signature-line { border-top: 1px solid #000; text-align: center; padding-top: 5px; font-size: 12px; }
            .total-section { text-align: right; margin-bottom: 30px; font-size: 14px; }
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
                <td><b>Folio Cotización:</b> ${quote.quoteNumber || '—'}</td>
                <td><b>Fecha Emisión:</b> ${new Date(quote.createdAt).toLocaleDateString('es-MX')}</td>
              </tr>
              <tr>
                <td><b>Cliente:</b> ${quote.customer.name}</td>
                <td><b>Teléfono:</b> ${quote.customer.phone}</td>
              </tr>
              <tr>
                <td colspan="2"><b>Dirección de Entrega:</b> ${quote.deliveryAddress || quote.customer.address || 'Recoge en Tienda'}</td>
              </tr>
              <tr>
                <td><b>Tipo de Movimiento:</b> ${quote.deliveryType === 'WILL_CALL' ? 'RECOLECCIÓN EN TIENDA' : 'ENTREGA A DOMICILIO'}</td>
                <td><b>Estado:</b> ${quote.status === 'SOLD' ? 'VENDIDA' : 'PENDIENTE'}</td>
              </tr>
            </table>
          </div>
          <div class="details">
            <h4 style="margin-bottom: 5px;">Detalle de Mercancía:</h4>
            <div style="border: 1px solid #000; padding: 10px; background-color: #fafafa; font-size: 13px; white-space: pre-wrap;">${itemsSummary}</div>
          </div>
          <div class="total-section">
            <h3>Subtotal: $${quote.subtotal.toFixed(2)} MXN</h3>
            <h3>IVA (16%): $${quote.tax.toFixed(2)} MXN</h3>
            <h2>TOTAL: $${quote.total.toFixed(2)} MXN</h2>
          </div>
          <div class="signature-grid">
            <div>
              <div style="height: 40px;"></div>
              <div class="signature-line">Autorizado por Ventas</div>
            </div>
            <div>
              <div style="height: 40px;"></div>
              <div class="signature-line">Firma de Conformidad (Cliente)</div>
            </div>
          </div>
          <div class="footer">
            <p style="font-weight: bold; font-size: 12px; margin-bottom: 8px;">¡Gracias por su preferencia!</p>
            <p style="margin: 2px 0;">Su confianza es nuestro motor. A/C Radiamex agradece su compra.</p>
            <div style="border: 1px dashed #000; padding: 8px; margin: 15px 0; text-align: left; font-size: 10px; line-height: 1.3;">
              <b>TÉRMINOS Y CONDICIONES DE GARANTÍA:</b><br/>
              1. Todo cambio o devolución requiere presentar este ticket físico de venta.<br/>
              2. Garantía de 30 días naturales a partir de la fecha de emisión en partes mecánicas contra defectos de fábrica.<br/>
              3. <b>IMPORTANTE:</b> No se aceptan cambios ni devoluciones en partes eléctricas de ningún tipo.<br/>
              4. Las piezas no deben presentar muestras de mala instalación, golpes o alteración estructural.
            </div>
            <p style="margin: 2px 0;"><b>Soporte Logístico:</b> soporte@radiamex.com | <b>Tel:</b> +52 418 239 4907</p>
            <p style="margin: 2px 0; font-size: 9px; color: #555;">Horario: Lun-Vie: 9:00 AM - 6:30 PM | Sáb: 9:00 AM - 2:30 PM</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(ticketHtml);
    printWindow.document.close();
  };

  return (
    <button
      onClick={printTicket}
      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 border-gray-300 hover:border-gray-400"
      title="Imprimir nota de venta"
    >
      <Printer size={14} className="text-gray-500" />
      <span>Imprimir Ticket</span>
    </button>
  );
}
