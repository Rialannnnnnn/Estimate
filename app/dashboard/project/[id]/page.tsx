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
  const normalizedMaterialQuery = materialQuery.trim().toLocaleLowerCase('id')
  const filteredMaterials = normalizedMaterialQuery
    ? materials.filter(
        (m) =>
          m.name.toLocaleLowerCase('id').includes(normalizedMaterialQuery) ||
          (m.category ?? '').toLocaleLowerCase('id').includes(normalizedMaterialQuery)
      )
    : materials

  return (
    <main className="min-h-screen bg-brand-blue text-white">
      <div className="fixed inset-0 grid-pattern pointer-events-none" />
      <BrowserWarning />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 sticky top-0 bg-brand-blue/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-white/10 border-white/30 text-white text-2xl font-bold h-auto py-1"
                  />
                  <Button
                    size="icon"
                    onClick={handleUpdateProjectName}
                    className="bg-white text-brand-blue hover:bg-white/90"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-display text-3xl md:text-4xl">{project.name}</h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Budget Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-label text-white/60 mb-1">TEMPLATE</p>
              <p className="text-lg font-semibold">{templates[project.template_type]?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-label text-white/60 mb-1">DANA</p>
              {isEditingBudget ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="bg-white/10 border-white/30 text-white text-lg font-bold w-32 h-auto py-1"
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
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="border-2 border-white/20 p-4">
              <p className="text-label text-white/60 mb-2">ESTIMASI</p>
              <p className="text-display text-xl">{formatCurrency(estimatedTotal)}</p>
            </div>
            <div className="border-2 border-white/20 p-4">
              <p className="text-label text-white/60 mb-2">REALISASI</p>
              <p className="text-display text-xl">{formatCurrency(currentTotal)}</p>
            </div>
            <div className="border-2 border-white/20 p-4">
              <p className="text-label text-white/60 mb-2">DIBELI</p>
              <p className="text-display text-xl">{purchasedCount}/{materials.length}</p>
            </div>
          </div>
        </div>

        {/* Expense Chart */}
        {materials.length > 0 && (
          <div className="border-2 border-white/20 bg-card/50 p-6 md:p-8 mb-12">
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-display text-2xl">DAFTAR KEBUTUHAN</h2>
            <Button
              onClick={() => setShowAddMaterial(!showAddMaterial)}
              className="border-2 border-white bg-white/10 text-white hover:bg-white hover:text-brand-blue"
            >
              <Settings className="w-4 h-4 mr-2" /> Tambah
            </Button>
          </div>

          {showAddMaterial && (
            <div className="border-2 border-white/20 bg-card/50 p-6 md:p-8 mb-6">
              <AddMaterialForm
                onAdd={(material) => {
                  handleAddMaterial(material.name, material.quantity, material.unitPrice, material.category)
                }}
                onCancel={() => setShowAddMaterial(false)}
              />
            </div>
          )}

          {materials.length > 0 && (
            <div className="relative mb-6 md:max-w-md">
              <label htmlFor="material-search" className="sr-only">
                Cari kebutuhan
              </label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
                aria-hidden="true"
              />
              <Input
                id="material-search"
                type="search"
                value={materialQuery}
                onChange={(e) => setMaterialQuery(e.target.value)}
                placeholder="Cari kebutuhan..."
                autoComplete="off"
                className="h-11 border-white/30 bg-white/10 pl-10 text-white placeholder:text-white/50"
              />
            </div>
          )}

          {materials.length > 0 && filteredMaterials.length === 0 ? (
            <div className="border-2 border-white/20 bg-card/50 p-8 text-center" role="status">
              <p className="text-white/60">Tidak ada kebutuhan yang cocok dengan pencarianmu.</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="border-2 border-white/20 bg-card/50 p-8 text-center">
              <p className="text-white/60 mb-4">Belum ada kebutuhan yang ditambahkan</p>
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
