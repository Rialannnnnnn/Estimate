import { ProjectDetail } from '@/components/finance-pages'

export default async function ProjectDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProjectDetail id={id} />
}
