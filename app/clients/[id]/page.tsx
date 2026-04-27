import { getClientById, updateClient, createVehicle } from "@/app/actions";
import { ClientDetailPageClient } from "@/app/components/ClientDetailPageClient";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const clientId = parseInt(id);
    const client = await getClientById(clientId);

    if (!client) {
        notFound();
    }

    return (
        <ClientDetailPageClient 
            client={client} 
            updateClient={updateClient} 
            createVehicle={createVehicle} 
        />
    );
}
