import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function generateInvoicePDF(order: any, client: any, vehicle: any) {
  const doc = new jsPDF() as any;

  // Colors and Styles
  const primaryColor = [26, 35, 126]; // Dark Indigo
  const accentColor = [99, 102, 241];

  // Header - Branding
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('REFACCIONARIA COYOTE', 15, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Especialistas en Frenos, Discos y Radiadores', 15, 32);

  // Invoice Info
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(`ORDEN: ${order.orderNumber}`, 160, 20);
  doc.text(`FECHA: ${new Date(order.createdAt).toLocaleDateString()}`, 160, 27);

  // Client & Vehicle Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL CLIENTE', 15, 55);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${client.name}`, 15, 62);
  if (client.phone) doc.text(`Teléfono: ${client.phone}`, 15, 69);
  if (client.email) doc.text(`Email: ${client.email}`, 15, 76);

  if (vehicle) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE LA UNIDAD', 120, 55);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Modelo: ${vehicle.model}`, 120, 62);
    doc.text(`Placas: ${vehicle.plate || 'N/A'}`, 120, 69);
  }

  // Items Table
  const tableData = order.itemsUsed.map((si: any) => [
    si.item.name,
    si.quantity,
    `$${si.unitPrice.toLocaleString()}`,
    `$${(si.quantity * si.unitPrice).toLocaleString()}`
  ]);

  doc.autoTable({
    startY: 90,
    head: [['DESCRIPCIÓN DE REFACCIONES', 'CANT', 'PRECIO UNIT.', 'SUBTOTAL']],
    body: tableData,
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 15, right: 15 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    }
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL A PAGAR:', 130, finalY + 5);
  
  doc.setFontSize(16);
  doc.setTextColor(...primaryColor);
  doc.text(`$${order.totalAmount.toLocaleString()} MXN`, 165, finalY + 5, { align: 'right' });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Gracias por su confianza. Refacciones garantizadas.', 105, 280, { align: 'center' });

  // Save
  doc.save(`Factura_Coyote_${order.orderNumber}.pdf`);
}
