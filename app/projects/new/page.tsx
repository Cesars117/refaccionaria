import { getClients, createProject } from "@/app/actions";
import { NewProjectForm } from "@/app/components/NewProjectForm";
import Link from 'next/link';
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic'

export default async function NewProjectPage() {
    const clients = await getClients();

    return (
        <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
            <Link href="/projects" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", textDecoration: "none" }}>
                <ArrowLeft size={20} />
                Regresar a Proyectos
            </Link>

            <h1 className="heading-xl">Nuevo Proyecto</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Inicia un nuevo contrato de mantenimiento para un cliente y vehículo.</p>

            <NewProjectForm clients={clients} createProject={createProject} />
        </main>
    );
}
