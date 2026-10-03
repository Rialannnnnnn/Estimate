'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { BrowserWarning } from '@/components/browser-warning'
import { ProjectCard } from '@/components/project-card'
import { TemplateSelector } from '@/components/template-selector'
import { NeedsGenerator } from '@/components/needs-generator'
import { Input } from '@/components/ui/input'
import { ArrowRight, LogOut, Plus, Search } from 'lucide-react'
import type { Material } from '@/lib/types'
import type { TemplateType } from '@/lib/templates'
import { templates } from '@/lib/templates'

interface Project {
  id: string
  name: string
  template_type: TemplateType
  budget: number
  spent: number
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null)
  const [projectName, setProjectName] = useState('')
  const [planningPeriod, setPlanningPeriod] = useState<'daily' | 'monthly'>('monthly')
  const [budgetLimit, setBudgetLimit] = useState('')
  const [showNeedsGenerator, setShowNeedsGenerator] = useState(false)
  const [criteria, setCriteria] = useState('')
  const [generatedNeeds, setGeneratedNeeds] = useState<Material[]>([])
  const [creatingProject, setCreatingProject] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      setUser(user)
      await fetchProjects(user.id)
      setLoading(false)
    }

    getUser()
  }, [router, supabase])

  const fetchProjects = async (userId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProjects(data as Project[])
    }
  }

  const handleCreateProject = async (needsOverride?: Material[]) => {
  if (!selectedTemplate || !projectName.trim()) return

  if (!showNeedsGenerator) {
    setShowNeedsGenerator(true)
    return
  }

  if (!user) {
    window.alert('Daftar kebutuhan sudah siap. Hubungkan akun untuk menyimpan rencana ini.')
    return
  }

  setCreatingProject(true)
    const templateData = templates[selectedTemplate]
    const plannedBudget = Number(budgetLimit) > 0 ? Number(budgetLimit) : templateData.budget

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            user_id: user.id,
            name: projectName,
            template_type: selectedTemplate,
            budget: plannedBudget,
            spent: 0,
          },
        ])
        .select()

      if (error) throw error

      if (data && data[0]) {
        // Create default materials
        const projectId = data[0].id
    const itemsToSave = needsOverride && needsOverride.length > 0 ? needsOverride : generatedNeeds.length > 0 ? generatedNeeds : templateData.defaultItems
    const materialsToInsert = itemsToSave.map((item) => ({
      project_id: projectId,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      is_purchased: false,
    }))

        const { error: materialsError } = await supabase
          .from('project_materials')
          .insert(materialsToInsert)

        if (materialsError) throw materialsError

        // Reset form and refresh
    setProjectName('')
    setSelectedTemplate(null)
    setShowNeedsGenerator(false)
    setCriteria('')
    setGeneratedNeeds([])
    setShowNewProject(false)
        await fetchProjects(user.id)
        router.push(`/dashboard/project/${projectId}`)
      }
    } catch (err) {
      console.error('Error creating project:', err)
    } finally {
      setCreatingProject(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId)

      if (error) throw error

      await fetchProjects(user.id)
    } catch (err) {
      console.error('Error deleting project:', err)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const fullName = user?.user_metadata?.full_name
  const displayName =
    typeof fullName === 'string' && fullName.trim() ? fullName.trim() : (user?.email ?? 'Pengguna')

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('id')
  const filteredProjects = normalizedQuery
    ? projects.filter((project) => project.name.toLocaleLowerCase('id').includes(normalizedQuery))
    : projects

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-blue text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">EstiMate</p>
          <p className="text-label opacity-70">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground paper-texture">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(189,235,234,.28),transparent_38%)] pointer-events-none" />
      <BrowserWarning />

      {/* Header */}
      <header className="relative z-10 border-b border-border/70 sticky top-0 bg-background/85 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-display text-4xl md:text-5xl text-primary">EstiMate</h1>
              <p className="text-label text-muted-foreground">Ruang tenang untuk mengatur kebutuhanmu</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <span className="text-label block text-muted-foreground">Masuk sebagai</span>
                <span className="text-sm font-semibold text-foreground">{displayName}</span>
              </div>
              <Button
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                variant="outline"
                className="rounded-full border border-primary/20 bg-card font-semibold text-primary hover:bg-secondary"
              >
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                {loggingOut ? 'Keluar...' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* New Project Section */}
        {!showNewProject ? (
          <div className="mb-12">
            <Button
              onClick={() => setShowNewProject(true)}
              className="w-full md:w-auto px-8 py-4 bg-primary text-primary-foreground border border-primary font-bold text-lg hover:bg-primary/90 rounded-full"
            >
              <Plus className="w-5 h-5 mr-2" /> Rencana Budget Baru
            </Button>
          </div>
        ) : (
          <div className="border border-border/70 bg-card/85 p-6 md:p-8 mb-12 rounded-3xl shadow-[0_18px_60px_rgba(23,59,88,.07)] backdrop-blur">
            <div className="mb-6">
              <p className="text-label font-bold text-primary mb-2">MULAI DARI KONTEKSMU</p>
              <h2 className="text-2xl font-semibold text-foreground">Apa yang perlu kamu siapkan?</h2>
              <p className="text-sm text-muted-foreground mt-2">Pilih pola kebutuhan sebagai titik awal. Semua barang, jumlah, dan harga bisa kamu ubah setelahnya.</p>
            </div>
            {showNeedsGenerator && (
              <NeedsGenerator
                period={planningPeriod}
                initialCriteria={criteria}
                initialItems={generatedNeeds}
                onConfirm={(items) => {
                  setGeneratedNeeds(items)
                  void handleCreateProject(items)
                }}
                onBack={() => setShowNeedsGenerator(false)}
              />
            )}
            {!showNeedsGenerator && <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />}

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-label block mb-2">Periode kebutuhan</label>
                <select value={planningPeriod} onChange={(e) => setPlanningPeriod(e.target.value as 'daily' | 'monthly')} className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground">
                  <option value="daily">Harian</option>
                  <option value="monthly">Bulanan</option>
                </select>
              </div>
              <div>
                <label className="text-label block mb-2">Batas budget opsional</label>
                <Input type="number" min="0" value={budgetLimit} onChange={(e) => setBudgetLimit(e.target.value)} placeholder={planningPeriod === 'daily' ? 'Contoh: 75000' : 'Contoh: 2500000'} className="h-12 rounded-xl border border-border bg-background text-foreground" />
              </div>
              <div>
                <label className="text-label block mb-2">Nama Rencana Budget</label>
                <Input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Contoh: Budget Bulanan April"
                  className="w-full px-4 py-3 border border-border bg-background text-foreground placeholder:text-muted-foreground rounded-xl"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => void handleCreateProject()}
                  disabled={!selectedTemplate || !projectName.trim() || creatingProject}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground border border-primary font-bold hover:bg-primary/90 disabled:opacity-50 rounded-full"
                >
                  {creatingProject ? 'Membuat...' : 'Buat Rencana'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  onClick={() => {
                    setShowNewProject(false)
                    setSelectedTemplate(null)
                    setProjectName('')
                    setShowNeedsGenerator(false)
                    setCriteria('')
                    setGeneratedNeeds([])
                    setBudgetLimit('')
                    setPlanningPeriod('monthly')
                  }}
                  className="px-6 py-3 border-2 border-white text-white hover:bg-white hover:text-brand-blue"
                >
                  Batal
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        <section>
          <div className="mb-8">
            <span className="text-label text-muted-foreground">Rencana Budgetmu</span>
            <h2 className="text-3xl font-bold mt-1">
              {projects.length} {projects.length === 1 ? 'Proyek' : 'Proyek'}
            </h2>
          </div>

          {projects.length > 0 && (
            <div className="relative mb-6 md:max-w-md">
              <label htmlFor="project-search" className="sr-only">
                Cari rencana budget
              </label>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="project-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari rencana budget..."
                autoComplete="off"
                className="h-12 rounded-full border border-border bg-card pl-11 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}

          {projects.length === 0 ? (
            <div className="border border-dashed border-border p-12 text-center rounded-3xl bg-card/60">
              <p className="text-muted-foreground text-lg">Belum ada rencana budget. Mulai dari kebutuhan yang paling penting.</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="border border-dashed border-border p-12 text-center rounded-3xl bg-card/60" role="status">
              <p className="text-muted-foreground text-lg">Tidak ada rencana yang cocok dengan pencarianmu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  templateType={project.template_type}
                  budget={project.budget}
                  spent={project.spent}
                  onDelete={() => handleDeleteProject(project.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
