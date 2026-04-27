import { getProjectById, createServiceOrder, getItems } from "@/app/actions";
import { NewServiceOrderForm } from "@/app/components/NewServiceOrderForm";
import { notFound } from "next/navigation";
import Link from 'next/link';
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic'

export default async function NewServiceOrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const project = await getProjectById(parseInt(id));
    const items = await getItems();

    if (!project) {
        notFound();
    }

    return (
        <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
            <Link href={`/projects/${id}`} style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", textDecoration: "none" }}>
                <ArrowLeft size={20} />
                Regresar al Proyecto
            </Link>

            <h1 className="heading-xl">Nueva Orden de Servicio</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
                Registra la salida de refacciones y mano de obra para: <strong>{project.name}</strong> ({project.vehicle?.model})
            </p>

            <NewServiceOrderForm 
                project={project} 
                items={items} 
                createServiceOrder={createServiceOrder} 
            />
        </main>
    );
}
