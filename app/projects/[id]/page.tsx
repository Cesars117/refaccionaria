import { getProjectById } from "@/app/actions";
import { ProjectDetailPageClient } from "@/app/components/ProjectDetailPageClient";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const project = await getProjectById(parseInt(id));

    if (!project) {
        notFound();
    }

    return (
        <ProjectDetailPageClient project={project} />
    );
}
