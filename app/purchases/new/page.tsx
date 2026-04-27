import { getSuppliers, getItems, createPurchaseOrder } from "@/app/actions";
import { NewPurchaseForm } from "@/app/components/NewPurchaseForm";
import Link from 'next/link';
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic'

export default async function NewPurchasePage() {
    const suppliers = await getSuppliers();
    const items = await getItems();

    return (
        <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
            <Link href="/purchases" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", textDecoration: "none" }}>
                <ArrowLeft size={20} />
                Regresar a Compras
            </Link>

            <h1 className="heading-xl">Registrar Entrada de Mercancía</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Registra una nueva compra a proveedores e incrementa el stock automáticamente.</p>

            <NewPurchaseForm 
                suppliers={suppliers} 
                items={items} 
                createPurchaseOrder={createPurchaseOrder} 
            />
        </main>
    );
}
