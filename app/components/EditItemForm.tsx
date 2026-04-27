'use client';

import { useState } from 'react';
import { ScanButton } from './ScanButton';
import { BarcodeGeneratorButton } from './BarcodeGeneratorButton';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { Plus, Trash2 } from 'lucide-react';

interface SerialEntry {
    id?: number;
    serialNumber: string;
    tmoSerial: string;
}

interface EditItemFormProps {
    item: {
        id: number;
        name: string;
        barcode?: string | null;
        categoryId: number;
        locationId: number;
        quantity: number;
        status: string;
        description?: string | null;
        unitType?: string | null;
        unitsPerBox?: number | null;
        siteKitSku?: string | null;
        serialNumbers?: Array<{ id: number; serialNumber: string | null; tmoSerial: string | null }>;
    };
    categories: Array<{ id: number; name: string }>;
    locations: Array<{ id: number; name: string }>;
    updateItem: (formData: FormData) => Promise<void>;
}

export function EditItemForm({ item, categories, locations, updateItem }: EditItemFormProps) {
    const { t } = useLanguage();
    const [barcode, setBarcode] = useState(item.barcode || '');
    const [unitType, setUnitType] = useState(item.unitType || 'units');
    const [categoryId, setCategoryId] = useState(item.categoryId);
    const [serialEntries, setSerialEntries] = useState<SerialEntry[]>(
        (item.serialNumbers || []).map(sn => ({
            id: sn.id,
            serialNumber: sn.serialNumber || '',
            tmoSerial: sn.tmoSerial || ''
        }))
    );

    const handleBarcodeSet = (scannedBarcode: string) => {
        setBarcode(scannedBarcode);
    };

    // Check if the selected category is "Material"
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    const isMaterial = selectedCategory?.name === 'Material';

    const addSerialEntry = () => {
        setSerialEntries([...serialEntries, { serialNumber: '', tmoSerial: '' }]);
    };

    const removeSerialEntry = (index: number) => {
        setSerialEntries(serialEntries.filter((_, i) => i !== index));
    };

    const updateSerialEntryField = (index: number, field: 'serialNumber' | 'tmoSerial', value: string) => {
        const updated = [...serialEntries];
        updated[index] = { ...updated[index], [field]: value };
        setSerialEntries(updated);
    };

    const handleSubmit = async (formData: FormData) => {
        const validSerials = serialEntries.filter(s => s.serialNumber.trim() || s.tmoSerial.trim());
        formData.set('serialNumbers', JSON.stringify(validSerials));
        await updateItem(formData);
    };

    return (
        <form action={handleSubmit} className="card" style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <input type="hidden" name="id" value={item.id} />
            
            <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>{t('newItem.name')}</label>
                <input
                    name="name"
                    type="text"
                    required
                    defaultValue={item.name}
                    placeholder={t('newItem.namePlaceholder')}
                    style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }}
                />
            </div>

            <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>{t('newItem.barcode')}</label>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                    <input
                        name="barcode"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        type="text"
                        placeholder={t('newItem.barcodePlaceholder')}
                        style={{ 
                            flex: 1, 
                            minWidth: "200px",
                            padding: "12px", 
                            background: "var(--bg-elevated)", 
                            border: "1px solid var(--border-light)", 
                            color: "var(--text-main)", 
                            borderRadius: "var(--radius-sm)", 
                            outline: "none" 
                        }}
                    />
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <ScanButton onScan={handleBarcodeSet} />
                        <BarcodeGeneratorButton onBarcodeGenerated={handleBarcodeSet} />
                    </div>
                </div>
                <small style={{ color: "var(--text-secondary)", fontSize: "0.875rem", display: "block", marginTop: "0.5rem" }}>
                    {barcode 
                        ? `${t('editItem.currentBarcode')}: ${barcode}` 
                        : t('editItem.noBarcode')
                    }
                </small>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>{t('newItem.category')}</label>
                    <select 
                        name="categoryId" 
                        defaultValue={item.categoryId}
                        onChange={(e) => setCategoryId(parseInt(e.target.value))}
                        required 
                        style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }}
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>{t('newItem.location')}</label>
                    <select name="locationId" defaultValue={item.locationId} required style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }}>
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>{t('newItem.quantity')}</label>
                    <input 
                        name="quantity" 
                        type="number" 
                        min="1" 
                        defaultValue={item.quantity} 
                        required 
                        style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }} 
                    />
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>{t('newItem.status')}</label>
                    <select name="status" defaultValue={item.status} required style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }}>
                        <option value="AVAILABLE">{t('status.AVAILABLE')}</option>
                        <option value="IN_USE">{t('status.IN_USE')}</option>
                        <option value="MAINTENANCE">{t('status.MAINTENANCE')}</option>
                        <option value="LOST">{t('status.LOST')}</option>
                    </select>
                </div>
            </div>

            {/* Material Configuration - Show if Material category is selected */}
            {isMaterial && (
                <div style={{ padding: "16px", background: "rgba(99, 102, 241, 0.05)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
                    <h4 style={{ margin: "0 0 12px 0", color: "var(--primary)", fontSize: "0.875rem", fontWeight: 600 }}>⚙️ {t('newItem.materialConfig')}</h4>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>{t('newItem.unitType')}</label>
                            <select 
                                name="unitType" 
                                defaultValue={item.unitType || 'units'}
                                onChange={(e) => setUnitType(e.target.value)}
                                style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }}
                            >
                                <option value="units">{t('newItem.unit')}</option>
                                <option value="boxes">{t('newItem.box')}</option>
                            </select>
                        </div>

                        {unitType === 'boxes' && (
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>{t('newItem.unitsPerBox')}</label>
                                <input 
                                    name="unitsPerBox" 
                                    type="number" 
                                    min="1" 
                                    defaultValue={item.unitsPerBox || 1}
                                    style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }} 
                                />
                            </div>
                        )}
                    </div>

                    <small style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                        {unitType === 'boxes' 
                            ? t('newItem.totalUnits')
                            : t('newItem.directUnits')
                        }
                    </small>
                </div>
            )}

            <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>{t('newItem.description')}</label>
                <textarea 
                    name="description" 
                    rows={3} 
                    defaultValue={item.description || ''}
                    placeholder={t('newItem.descriptionPlaceholder')} 
                    style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none", resize: "vertical", minHeight: "80px" }}
                />
            </div>

            {/* Site Kit SKU */}
            <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Site Kit SKU ({t('newItem.descriptionPlaceholder').includes('opcional') ? 'Opcional' : 'Optional'})</label>
                <input
                    name="siteKitSku"
                    type="text"
                    defaultValue={item.siteKitSku || ''}
                    placeholder="Ej. SK-2024-001"
                    style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }}
                />
            </div>

            {/* Serial Numbers Section */}
            <div style={{ padding: "16px", background: "rgba(99, 102, 241, 0.05)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h4 style={{ margin: 0, color: "var(--primary)", fontSize: "0.875rem", fontWeight: 600 }}>
                        🔢 {t('serialNumbers.title')}
                    </h4>
                    <button
                        type="button"
                        onClick={addSerialEntry}
                        style={{
                            display: "flex", alignItems: "center", gap: "4px",
                            padding: "6px 12px", background: "var(--primary)", color: "white",
                            border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer",
                            fontSize: "0.8rem", fontWeight: 500
                        }}
                    >
                        <Plus size={14} /> {t('serialNumbers.add')}
                    </button>
                </div>

                {serialEntries.length === 0 && (
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
                        {t('serialNumbers.empty')}
                    </p>
                )}

                {serialEntries.map((entry, index) => (
                    <div key={index} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div style={{ flex: 1 }}>
                            {index === 0 && <label style={{ display: "block", marginBottom: "4px", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 500 }}>Serial Number</label>}
                            <input
                                type="text"
                                value={entry.serialNumber}
                                onChange={(e) => updateSerialEntryField(index, 'serialNumber', e.target.value)}
                                placeholder="Serial Number"
                                style={{ width: "100%", padding: "10px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none", fontSize: "0.875rem" }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            {index === 0 && <label style={{ display: "block", marginBottom: "4px", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 500 }}>TMO Serial (T-Mobile)</label>}
                            <input
                                type="text"
                                value={entry.tmoSerial}
                                onChange={(e) => updateSerialEntryField(index, 'tmoSerial', e.target.value)}
                                placeholder="TMO Serial"
                                style={{ width: "100%", padding: "10px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none", fontSize: "0.875rem" }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => removeSerialEntry(index)}
                            style={{
                                padding: "10px", background: "rgba(239, 68, 68, 0.1)", color: "#dc2626",
                                border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer",
                                marginTop: index === 0 ? "20px" : "0", flexShrink: 0
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}

                {serialEntries.length > 0 && (
                    <small style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                        {serialEntries.filter(s => s.serialNumber.trim() || s.tmoSerial.trim()).length} de {serialEntries.length} con datos.
                    </small>
                )}
            </div>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <button type="submit" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "1rem", fontWeight: 600, flex: 1, minWidth: "180px" }}>
                    💾 {t('editItem.updateItem')}
                </button>
            </div>
        </form>
    );
}