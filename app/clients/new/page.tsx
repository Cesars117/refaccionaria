import { createClient } from "@/app/actions";
import { NewClientForm } from "@/app/components/NewClientForm";
import Link from 'next/link';
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic'

export default function NewClientPage() {
    return (
        <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
            <Link href="/clients" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", textDecoration: "none" }}>
                <ArrowLeft size={20} />
                Regresar a Clientes
            </Link>

            <h1 className="heading-xl">Nuevo Cliente</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Registra un nuevo cliente y su información de contacto.</p>

            <NewClientForm createClient={createClient} />
        </main>
    );
}
