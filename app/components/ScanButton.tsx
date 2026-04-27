'use client'

import { useState } from 'react'
import { BarcodeScanner } from './BarcodeScanner'
import { Camera } from 'lucide-react'

interface ScanButtonProps {
  onScan: (barcode: string) => void
  label?: string
}

export function ScanButton({ onScan, label = "Scan" }: ScanButtonProps) {
  const [isScanning, setIsScanning] = useState(false)

  const handleScan = (result: string) => {
    onScan(result)
    setIsScanning(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsScanning(true)}
        style={{
          padding: "12px 16px",
          background: "var(--primary)",
          color: "white",
          border: "none",
          borderRadius: "var(--radius-sm)",
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "0.875rem",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap"
        }}
        onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = "var(--primary-dark, #4338ca)"}
        onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = "var(--primary)"}
      >
        <Camera size={16} />
        {label}
      </button>

      {isScanning && (
        <BarcodeScanner
          onCodeScanned={handleScan}
          onClose={() => setIsScanning(false)}
        />
      )}
    </>
  )
}