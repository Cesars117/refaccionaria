import { getProjects } from '@/app/actions'
import { ProjectsPageClient } from '@/app/components/ProjectsPageClient'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const projects = await getProjects()

  return <ProjectsPageClient projects={projects} />
}
