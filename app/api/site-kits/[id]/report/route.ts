import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import db from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

interface ReportAssetTag {
  assetTag: string
  status: string
  linkedItem: { id: number; name: string } | null
}

interface ReportItem {
  siteKitSku: string
  description: string
  quantityExpected: number
  quantityReceived: number
  status: string
  notes: string | null
  assetTags: ReportAssetTag[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const siteKitDbId = parseInt(id)
  if (isNaN(siteKitDbId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const format = request.nextUrl.searchParams.get('format') || 'pdf'

  const siteKit = await db.siteKit.findUnique({
    where: { id: siteKitDbId },
    include: {
      items: {
        orderBy: { siteKitSku: 'asc' },
        include: {
          assetTags: {
            include: {
              linkedItem: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  })

  if (!siteKit) {
    return NextResponse.json({ error: 'Site Kit not found' }, { status: 404 })
  }

  // Build report data
  const items = siteKit.items as unknown as ReportItem[]
  const totalItems = items.length
  const verified = items.filter((i) => i.status === 'VERIFIED').length
  const missing = items.filter((i) => i.status === 'MISSING').length
  const surplus = items.filter((i) => i.status === 'SURPLUS').length
  const partial = items.filter((i) => i.status === 'PARTIAL').length
  const totalExpected = items.reduce((s: number, i) => s + i.quantityExpected, 0)
  const totalReceived = items.reduce((s: number, i) => s + i.quantityReceived, 0)
  const totalMissing = totalExpected - totalReceived
  const matchRate = totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0

  const dateStr = new Date().toISOString().split('T')[0]
  const fileName = `${siteKit.siteKitId}_comparison_report_${dateStr}`

  // Log the export
  await db.$transaction(async (tx) => {
    await createAuditLog(tx, session, {
      action: 'CREATED',
      entityType: 'SITE_KIT',
      entityId: siteKit.id,
      entityLabel: `Report exported as ${format.toUpperCase()}`,
    })
  })

  if (format === 'excel') {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    // Summary sheet
    const summaryData = [
      ['Site Kit Comparison Report'],
      [],
      ['Site Kit ID', siteKit.siteKitId],
      ['Site ID', siteKit.siteId || ''],
      ['Project Name', siteKit.projectName || ''],
      ['BOM ID', siteKit.bomId || ''],
      ['Auth #', siteKit.authNumber || ''],
      ['Date Completed', siteKit.dateCompleted ? new Date(siteKit.dateCompleted).toLocaleDateString() : ''],
      ['MSL Location', siteKit.mslLocation || ''],
      ['Company', siteKit.company || ''],
      ['CATS Code', siteKit.catsCode || ''],
      ['Overall Status', siteKit.status],
      ['Report Generated', `${new Date().toLocaleString()} by ${session.user?.name || session.user?.email || 'Unknown'}`],
      [],
      ['Metric', 'Value'],
      ['Total Line Items (BOM)', totalItems],
      ['Items Fully Verified', verified],
      ['Items Missing', missing],
      ['Items with Surplus', surplus],
      ['Items Partially Received', partial],
      ['Total Units Expected', totalExpected],
      ['Total Units Received', totalReceived],
      ['Total Units Missing', totalMissing > 0 ? totalMissing : 0],
      ['Match Rate', `${matchRate}%`],
    ]
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

    // Detail sheet
    const detailHeaders = [
      'Site Kit SKU', 'Description', 'Expected Qty', 'Received Qty',
      'Difference', 'Status', 'Asset Tags Verified', 'Missing Asset Tags', 'Notes',
    ]
    const detailRows = items.map((item) => {
      const verifiedTags = item.assetTags.filter((t) => t.status === 'RECEIVED').map((t) => t.assetTag).join(', ')
      const missingTags = item.assetTags.filter((t) => t.status !== 'RECEIVED').map((t) => t.assetTag).join(', ')
      return [
        item.siteKitSku,
        item.description,
        item.quantityExpected,
        item.quantityReceived,
        item.quantityReceived - item.quantityExpected,
        item.status,
        verifiedTags,
        missingTags,
        item.notes || '',
      ]
    })
    const detailSheet = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows])
    XLSX.utils.book_append_sheet(wb, detailSheet, 'Detail')

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}.xlsx"`,
      },
    })
  }

  // PDF format using jsPDF
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ orientation: 'landscape' })

  // Title
  doc.setFontSize(18)
  doc.text('Site Kit Comparison Report', 14, 20)

  // Header info
  doc.setFontSize(10)
  const headerLines = [
    `Site Kit ID: ${siteKit.siteKitId}    Site ID: ${siteKit.siteId || 'N/A'}    Project: ${siteKit.projectName || 'N/A'}`,
    `BOM ID: ${siteKit.bomId || 'N/A'}    Auth #: ${siteKit.authNumber || 'N/A'}    Date Completed: ${siteKit.dateCompleted ? new Date(siteKit.dateCompleted).toLocaleDateString() : 'N/A'}`,
    `MSL Location: ${siteKit.mslLocation || 'N/A'}    Company: ${siteKit.company || 'N/A'}    CATS Code: ${siteKit.catsCode || 'N/A'}`,
    `Report Generated: ${new Date().toLocaleString()} by ${session.user?.name || session.user?.email || 'Unknown'}`,
    `Overall Status: ${siteKit.status}`,
  ]
  let y = 30
  for (const line of headerLines) {
    doc.text(line, 14, y)
    y += 6
  }

  // Summary table
  y += 4
  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Total Line Items (BOM)', String(totalItems)],
      ['Items Fully Verified', String(verified)],
      ['Items Missing', String(missing)],
      ['Items with Surplus', String(surplus)],
      ['Items Partially Received', String(partial)],
      ['Total Units Expected', String(totalExpected)],
      ['Total Units Received', String(totalReceived)],
      ['Total Units Missing', String(totalMissing > 0 ? totalMissing : 0)],
      ['Match Rate', `${matchRate}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14 },
    tableWidth: 120,
  })

  // Detail table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || y + 80
  autoTable(doc, {
    startY: finalY + 10,
    head: [['SKU', 'Description', 'Expected', 'Received', 'Diff', 'Status', 'Verified Tags', 'Missing Tags', 'Notes']],
    body: items.map((item: ReportItem) => {
      const verifiedTags = item.assetTags.filter((t: ReportAssetTag) => t.status === 'RECEIVED').map((t: ReportAssetTag) => t.assetTag).join(', ')
      const missingTags = item.assetTags.filter((t: ReportAssetTag) => t.status !== 'RECEIVED').map((t: ReportAssetTag) => t.assetTag).join(', ')
      return [
        item.siteKitSku,
        item.description.length > 40 ? item.description.substring(0, 40) + '...' : item.description,
        String(item.quantityExpected),
        String(item.quantityReceived),
        String(item.quantityReceived - item.quantityExpected),
        item.status,
        verifiedTags.length > 30 ? verifiedTags.substring(0, 30) + '...' : verifiedTags,
        missingTags.length > 30 ? missingTags.substring(0, 30) + '...' : missingTags,
        item.notes || '',
      ]
    }),
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    bodyStyles: { fontSize: 7 },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 5) {
        const status = Array.isArray(data.row.raw) ? data.row.raw[5] : ''
        if (status === 'VERIFIED') data.cell.styles.fillColor = [220, 252, 231]
        else if (status === 'MISSING') data.cell.styles.fillColor = [254, 226, 226]
        else if (status === 'PARTIAL') data.cell.styles.fillColor = [255, 237, 213]
        else if (status === 'SURPLUS') data.cell.styles.fillColor = [219, 234, 254]
      }
    },
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128)
    doc.text(
      'Generated by Inventory System | Confidential',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}.pdf"`,
    },
  })
}
