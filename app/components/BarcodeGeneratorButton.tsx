'use client'

import { generateUniqueBarcode } from "@/app/actions"

interface BarcodeGeneratorButtonProps {
    onBarcodeGenerated?: (barcode: string) => void;
}

export function BarcodeGeneratorButton({ onBarcodeGenerated }: BarcodeGeneratorButtonProps) {
    const handleGenerate = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            const barcode = await generateUniqueBarcode();
            
            // If callback is provided, use it (for controlled components)
            if (onBarcodeGenerated) {
                onBarcodeGenerated(barcode);
            } else {
                // Fallback to direct DOM manipulation (for uncontrolled components)
                const input = document.getElementById('barcode-input') as HTMLInputElement;
                if (input) {
                    input.value = barcode;
                    // Trigger input event to notify React
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        } catch (error) {
            console.error('Error generating barcode:', error);
            alert('Error generating barcode');
        }
    };

    return (
        <button
            type="button"
            onClick={handleGenerate}
            style={{
                padding: "12px 16px",
                background: "rgba(99, 102, 241, 0.1)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                color: "var(--primary)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                fontWeight: 600,
                whiteSpace: "nowrap"
            }}
        >
            Generate
        </button>
    );
}
