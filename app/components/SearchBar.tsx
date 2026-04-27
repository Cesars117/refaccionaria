'use client';

import { useState } from 'react';
import { BarcodeScanner } from './BarcodeScanner';
import { BarcodeScanResult } from './BarcodeScanResult';
import { LogoutButton } from './LogoutButton';
import { Search, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { findItemByBarcode } from '@/app/actions';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { LanguageToggle } from './LanguageToggle';

export function SearchBar() {
    const [searchQuery, setSearchQuery] = useState('');
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scanResult, setScanResult] = useState<{ barcode: string; item: { id: number; name: string; barcode: string | null; quantity: number; status: string; category: { name: string }; location: { name: string } } | null } | null>(null);
    const router = useRouter();
    const { t } = useLanguage();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Cerrar teclado en móvil
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            router.push(`/?query=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleBarcodeScanned = async (code: string) => {
        console.log('Barcode scanned:', code);
        setScannerOpen(false);
        
        // Buscar el item en la base de datos
        const item = await findItemByBarcode(code);
        setScanResult({ barcode: code, item });
    };

    const handleCloseScanResult = () => {
        setScanResult(null);
    };

    return (
        <>
            <style jsx>{`
                @media (max-width: 640px) {
                    .search-form {
                        flex-direction: column;
                        gap: 12px !important;
                    }
                    .search-buttons {
                        display: flex;
                        gap: 8px;
                        width: 100%;
                    }
                    .search-buttons button {
                        flex: 1;
                        justify-content: center;
                    }
                }
            `}</style>
            <form 
                onSubmit={handleSearch}
                className="search-form"
                style={{ 
                    display: "flex", 
                    gap: "8px", 
                    marginBottom: "2rem",
                    alignItems: "stretch",
                    flexWrap: "wrap"
                }}
            >
                <div style={{ 
                    position: "relative", 
                    flex: 1, 
                    minWidth: "200px" 
                }}>
                    <Search 
                        size={20} 
                        style={{ 
                            position: "absolute", 
                            left: "12px", 
                            top: "50%", 
                            transform: "translateY(-50%)", 
                            color: "var(--text-secondary)" 
                        }} 
                    />
                    <input
                        type="text"
                        placeholder={t('search.placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "12px 12px 12px 44px",
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border-light)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--text-main)",
                            outline: "none"
                        }}
                    />
                </div>
                
                <div className="search-buttons" style={{ display: "flex", gap: "8px" }}>
                    <button
                        type="button"
                        onClick={() => setScannerOpen(true)}
                        style={{
                            padding: "12px 16px",
                            background: "var(--primary)",
                            color: "white",
                            border: "none",
                            borderRadius: "var(--radius-sm)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontWeight: "500",
                            whiteSpace: "nowrap"
                        }}
                        title={t('search.scanBarcode')}
                    >
                        <Camera size={20} />
                        <span style={{ 
                            display: "inline-block",
                            minWidth: "max-content"
                        }}>
                            {t('search.scanBarcode')}
                        </span>
                    </button>

                    <button
                        type="submit"
                        style={{
                            padding: "12px 20px",
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border-light)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--text-main)",
                            cursor: "pointer",
                            fontWeight: "500",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {t('common.search')}
                    </button>

                    <LanguageToggle />
                    <LogoutButton />
                </div>
            </form>

            {scannerOpen && (
                <BarcodeScanner
                    onCodeScanned={handleBarcodeScanned}
                    onClose={() => setScannerOpen(false)}
                />
            )}

            {scanResult && (
                <BarcodeScanResult
                    barcode={scanResult.barcode}
                    item={scanResult.item}
                    onClose={handleCloseScanResult}
                />
            )}
        </>
    );
}