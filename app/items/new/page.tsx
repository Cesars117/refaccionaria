import { createItem } from "@/app/actions";
import { NewItemForm } from "@/app/components/NewItemForm";
import db from "@/lib/db";
import Link from 'next/link';
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic'

export default async function NewItemPage({
    searchParams
}: {
    searchParams: { barcode?: string }
}) {
    const categories = await db.category.findMany({ orderBy: { name: 'asc' } });
    const locations = await db.location.findMany({ orderBy: { name: 'asc' } });
    const preloadedBarcode = searchParams.barcode || null;

    return (
        <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", textDecoration: "none" }}>
                <ArrowLeft size={20} />
                Back to Dashboard
            </Link>

            <h1 className="heading-xl">New Item</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Register a new tool or material in inventory with barcode scanning.</p>

            <NewItemForm 
                categories={categories}
                locations={locations}
                createItem={createItem}
                preloadedBarcode={preloadedBarcode}
            />
        </main>
    );
}
