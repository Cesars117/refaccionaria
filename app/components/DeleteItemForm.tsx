'use client'

interface SerialInfo {
  id: number
  serialNumber: string | null
  tmoSerial: string | null
}

interface DeleteFormProps {
  itemId: number
  itemName: string
  serialNumbers: SerialInfo[]
  deleteItem: (formData: FormData) => Promise<void>
}

export function DeleteItemForm({ itemId, itemName, serialNumbers, deleteItem }: DeleteFormProps) {
  const buildConfirmMessage = () => {
    let msg = `Are you sure you want to delete "${itemName}"?`
    if (serialNumbers.length > 0) {
      msg += `\n\n${serialNumbers.length} serial number(s) will be deleted:`
      serialNumbers.forEach((sn, i) => {
        const parts: string[] = []
        if (sn.serialNumber) parts.push(`SN: ${sn.serialNumber}`)
        if (sn.tmoSerial) parts.push(`TMO: ${sn.tmoSerial}`)
        msg += `\n  ${i + 1}. ${parts.join(' | ')}`
      })
    }
    return msg
  }

  return (
    <form 
      action={deleteItem} 
      onSubmit={(e) => {
        if (!confirm(buildConfirmMessage())) {
          e.preventDefault()
        }
      }}
      className="card"
      style={{ padding: "1.5rem", border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.05)" }}
    >
      <input type="hidden" name="id" value={itemId} />
      
      <h3 style={{ color: "#dc2626", marginBottom: "0.5rem", fontSize: "1.125rem", fontWeight: 600 }}>
        Danger Zone
      </h3>
      <p style={{ color: "var(--text-secondary)", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
        Once deleted, this item cannot be recovered. This action is permanent.
      </p>

      {serialNumbers.length > 0 && (
        <div style={{ marginBottom: "1rem", padding: "12px", background: "rgba(239, 68, 68, 0.08)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
          <p style={{ color: "#dc2626", fontSize: "0.8rem", fontWeight: 600, margin: "0 0 8px 0" }}>
            ⚠️ {serialNumbers.length} serial number(s) will be deleted:
          </p>
          <div style={{ maxHeight: "150px", overflowY: "auto" }}>
            {serialNumbers.map((sn, i) => (
              <div key={sn.id} style={{ fontSize: "0.8rem", color: "var(--text-secondary)", padding: "4px 0", borderBottom: i < serialNumbers.length - 1 ? "1px solid rgba(239, 68, 68, 0.1)" : "none" }}>
                <span style={{ fontWeight: 500 }}>#{i + 1}</span>
                {sn.serialNumber && <span style={{ marginLeft: "8px" }}>SN: <code style={{ background: "rgba(0,0,0,0.05)", padding: "2px 4px", borderRadius: "3px" }}>{sn.serialNumber}</code></span>}
                {sn.tmoSerial && <span style={{ marginLeft: "8px" }}>TMO: <code style={{ background: "rgba(0,0,0,0.05)", padding: "2px 4px", borderRadius: "3px" }}>{sn.tmoSerial}</code></span>}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button
        type="submit"
        style={{
          width: "100%",
          padding: "12px 24px",
          background: "#dc2626",
          color: "white",
          border: "none",
          borderRadius: "var(--radius-sm)",
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.2s ease"
        }}
        onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = "#b91c1c"}
        onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = "#dc2626"}
      >
        Permanently Delete Item
      </button>
    </form>
  )
}