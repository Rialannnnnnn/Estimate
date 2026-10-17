'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BrowserWarning } from '@/components/browser-warning'
import { BudgetIndicator } from '@/components/budget-indicator'
import { MaterialItem } from '@/components/material-item'
import { AddMaterialForm } from '@/components/add-material-form'
import { ExpenseChart } from '@/components/expense-chart'
import { formatCurrency, getBudgetStatus } from '@/lib/budget'
import { templates } from '@/lib/templates'
import type { TemplateType } from '@/lib/templates'
import {
  ArrowLeft,
  Settings,
  Trash2,
  Edit2,
  Check,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { smartFilterMaterials } from '@/lib/smart-search'

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

interface Material {
  id: string
  name: string
  quantity: number
  unit_price: number
  actual_price: number | null
  category: string
  is_purchased: boolean
}

interface Project {
  id: string
  name: string
  template_type: TemplateType
  budget: number
  spent: number
  created_at: string
  user_id: string
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [project, setProject] = useState<Project | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [editBudget, setEditBudget] = useState('')
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [materialQuery, setMaterialQuery] = useState('')

  useEffect(() => {
    const loadProject = async () => {
      try {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single()

        if (projectError) throw projectError

        setProject(projectData as Project)
        setEditName(projectData.name)
        setEditBudget(projectData.budget.toString())

        // Fetch materials
        const { data: materialsData, error: materialsError } = await supabase
          .from('project_materials')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: true })

        if (materialsError) throw materialsError
        setMaterials(materialsData as Material[])
      } catch (err) {
        console.error('Error loading project:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadProject()
  }, [id, supabase])

  const handleUpdateProjectName = async () => {
    if (!project || !editName.trim()) return

    try {
      const { error } = await supabase
        .from('projects')
        .update({ name: editName })
        .eq('id', project.id)

      if (error) throw error

      setProject({ ...project, name: editName })
      setIsEditingName(false)
    } catch (err) {
      console.error('Error updating project name:', err)
    }
  }

  const handleUpdateBudget = async () => {
    if (!project) return

    const budgetAmount = parseFloat(editBudget)
    if (isNaN(budgetAmount)) return

    try {
      const { error } = await supabase
        .from('projects')
        .update({ budget: budgetAmount })
        .eq('id', project.id)

      if (error) throw error

      setProject({ ...project, budget: budgetAmount })
      setIsEditingBudget(false)
    } catch (err) {
      console.error('Error updating budget:', err)
    }
  }

  const handleUpdateMaterial = async (materialId: string, updates: Partial<Material>) => {
    try {
      const { error } = await supabase
        .from('project_materials')
        .update(updates)
        .eq('id', materialId)

      if (error) throw error

      setMaterials(materials.map(m => m.id === materialId ? { ...m, ...updates } : m))
    } catch (err) {
      console.error('Error updating material:', err)
    }
  }

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      const { error } = await supabase
        .from('project_materials')
        .delete()
        .eq('id', materialId)

      if (error) throw error

      setMaterials(materials.filter(m => m.id !== materialId))
    } catch (err) {
      console.error('Error deleting material:', err)
    }
  }

  const handleAddMaterial = async (name: string, quantity: number, unitPrice: number, category: string) => {
    try {
      const { data, error } = await supabase
        .from('project_materials')
        .insert([
          {
            project_id: id,
            name,
            quantity,
            unit_price: unitPrice,
            category,
            is_purchased: false,
          },
        ])
        .select()

      if (error) throw error

      if (data) {
        setMaterials([...materials, data[0] as Material])
        setShowAddMaterial(false)
      }
    } catch (err) {
      console.error('Error adding material:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-blue text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">EstiMate</p>
          <p className="text-label opacity-70">Memuat proyek...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-brand-blue text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">Proyek tidak ditemukan</p>
          <Link href="/dashboard">
            <Button className="border-2 border-white text-white hover:bg-white hover:text-brand-blue">
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentTotal = materials.reduce(
    (sum, m) => sum + (m.actual_price !== null ? m.actual_price : m.quantity * m.unit_price),
    0
  )
  const budgetStatus = getBudgetStatus(currentTotal, project.budget)
  const estimatedTotal = materials.reduce((sum, m) => sum + m.quantity * m.unit_price, 0)
  const purchasedCount = materials.filter(m => m.is_purchased).length
  const filteredMaterials = smartFilterMaterials(materials, materialQuery)

  return (
    <main className="min-h-screen overflow-x-clip bg-brand-blue text-white">
      <div className="fixed inset-0 grid-pattern pointer-events-none" aria-hidden="true" />
      <BrowserWarning />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-blue/95 backdrop-blur supports-[backdrop-filter]:bg-brand-blue/85">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/dashboard" aria-label="Kembali ke dashboard" className="shrink-0">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" tabIndex={-1}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    aria-label="Nama proyek"
                    className="min-w-0 bg-white/10 border-white/30 text-white text-xl sm:text-2xl font-bold h-auto py-1"
                  />
                  <Button
                    size="icon"
                    onClick={handleUpdateProjectName}
                    aria-label="Simpan nama proyek"
                    className="shrink-0 bg-white text-brand-blue hover:bg-white/90"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group min-w-0">
                  <h1 className="text-display text-2xl sm:text-3xl md:text-4xl min-w-0 break-words py-1">{project.name}</h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    aria-label="Ubah nama proyek"
                    className="shrink-0 p-1 opacity-80 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-0 container mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Budget Section */}
        <div className="mb-10 md:mb-12">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
            <div className="min-w-0">
              <p className="text-label text-white/85 mb-1">TEMPLATE</p>
              <p className="text-lg font-semibold break-words">{templates[project.template_type]?.name}</p>
            </div>
            <div className="text-right ml-auto">
              <p className="text-label text-white/85 mb-1">DANA</p>
              {isEditingBudget ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    aria-label="Jumlah dana"
                    className="bg-white/10 border-white/30 text-white text-lg font-bold w-36 h-auto py-1"
                  />
                  <Button
                    size="icon"
                    onClick={handleUpdateBudget}
                    className="bg-white text-brand-blue hover:bg-white/90"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingBudget(true)}
                  className="hover:opacity-70 transition-opacity text-display text-2xl"
                >
                  {formatCurrency(project.budget)}
                </button>
              )}
            </div>
          </div>

          <BudgetIndicator
            currentTotal={currentTotal}
            budgetLimit={project.budget}
            status={budgetStatus}
            className="mb-8"
          />

          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {[
              { label: 'ESTIMASI', value: formatCurrency(estimatedTotal) },
              { label: 'REALISASI', value: formatCurrency(currentTotal) },
              { label: 'DIBELI', value: `${purchasedCount}/${materials.length}` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-soft-blue bg-ice-blue p-4 text-ink shadow-[0_4px_14px_rgba(15,46,71,0.12)] sm:flex-col sm:justify-center sm:text-center"
              >
                <p className="text-label text-ink-muted sm:mb-1">{stat.label}</p>
                <p className="text-display text-lg sm:text-base lg:text-xl min-w-0 break-words text-primary">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Chart */}
        {materials.length > 0 && (
          <div className="mb-10 rounded-2xl border border-soft-blue bg-card p-4 text-ink shadow-[0_8px_24px_rgba(15,46,71,0.16)] sm:p-6 md:mb-12 md:p-8">
            <ExpenseChart materials={materials.map(m => ({
              name: m.name,
              quantity: m.quantity,
              unitPrice: m.unit_price,
              actualPrice: m.actual_price,
              category: m.category,
              isPurchased: m.is_purchased,
            }))} />
          </div>
        )}

        {/* Materials Section */}
        <div className="mb-12">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-display text-xl sm:text-2xl">DAFTAR KEBUTUHAN</h2>
            <Button
              onClick={() => setShowAddMaterial(!showAddMaterial)}
              className="rounded-full border border-white/30 bg-white text-primary hover:bg-soft-blue"
            >
              <Settings className="w-4 h-4 mr-2" /> Tambah
            </Button>
          </div>

          {showAddMaterial && (
            <div className="mb-6 rounded-2xl border border-soft-blue bg-card p-4 text-ink sm:p-6 md:p-8">
              <AddMaterialForm
                onAdd={(material) => {
                  handleAddMaterial(material.name, material.quantity, material.unitPrice, material.category)
                }}
                onCancel={() => setShowAddMaterial(false)}
              />
            </div>
          )}

          {materials.length > 0 && (
            <div className="mb-6 flex flex-col gap-2 md:max-w-md">
              <div className="relative">
                <label htmlFor="material-search" className="sr-only">
                  Cari kebutuhan
                </label>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-brand-blue"
                  aria-hidden="true"
                />
                <Input
                  id="material-search"
                  type="search"
                  value={materialQuery}
                  onChange={(e) => setMaterialQuery(e.target.value)}
                  placeholder="Cari kebutuhan..."
                  autoComplete="off"
                  aria-describedby="material-search-hint"
                  className="h-12 rounded-xl border border-soft-blue bg-card pl-11 text-base font-medium text-ink shadow-sm placeholder:text-ink-muted focus-visible:border-brand-secondary focus-visible:ring-4 focus-visible:ring-soft-blue/50 dark:bg-card dark:text-ink"
                />
              </div>
              <p id="material-search-hint" className="text-sm leading-relaxed text-white/85">
                Contoh: makanan belum dibeli · di bawah 100 ribu · paling mahal
              </p>
            </div>
          )}

          {materials.length > 0 && filteredMaterials.length === 0 ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-soft-blue bg-card p-8 text-center" role="status">
              <p className="text-base font-semibold text-card-foreground">Tidak ada kebutuhan yang cocok.</p>
              <p className="text-sm leading-relaxed text-card-foreground/85 text-pretty">
                Coba gunakan nama barang, kategori, status pembelian, atau rentang harga.
              </p>
            </div>
          ) : materials.length === 0 ? (
            <div className="border-2 border-white/20 bg-card/50 p-8 text-center">
              <p className="text-white/85 mb-4">Belum ada kebutuhan yang ditambahkan</p>
              <Button
                onClick={() => setShowAddMaterial(true)}
                className="border-2 border-white text-white hover:bg-white hover:text-brand-blue"
              >
                Tambah Kebutuhan Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMaterials.map((material) => (
                <MaterialItem
                  key={material.id}
                  material={{
                    id: material.id,
                    name: material.name,
                    quantity: material.quantity,
                    unitPrice: material.unit_price,
                    actualPrice: material.actual_price || undefined,
                    isPurchased: material.is_purchased,
                    category: material.category,
                  }}
                  onUpdate={(updated) => {
                    handleUpdateMaterial(material.id, {
                      quantity: updated.quantity,
                      actual_price: updated.actualPrice || null,
                      is_purchased: updated.isPurchased,
                    })
                  }}
                  onDelete={() => handleDeleteMaterial(material.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
