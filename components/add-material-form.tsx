'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X } from 'lucide-react'
import { generateId } from '@/lib/storage'
import { parseCurrencyInput } from '@/lib/budget'
import type { Material } from '@/lib/types'

interface AddMaterialFormProps {
  onAdd: (material: Material) => void
  onCancel?: () => void
}

export function AddMaterialForm({ onAdd }: AddMaterialFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('pcs')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !price) return

    const newMaterial: Material = {
      id: generateId(),
      name: name.trim(),
      category: unit.trim() || 'Kebutuhan',
      unitPrice: parseCurrencyInput(price),
      actualPrice: null,
      quantity: parseInt(quantity, 10) || 1,
      isPurchased: false,
    }

    onAdd(newMaterial)
    setName('')
    setPrice('')
    setQuantity('1')
    setUnit('pcs')
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-6 border border-dashed border-border/50 hover:border-primary text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        <span className="font-semibold">Tambah Bahan</span>
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-label text-muted-foreground">New Material</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground h-7 w-7 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="material-name" className="text-label text-muted-foreground">
          Nama Bahan
        </Label>
        <Input
          id="material-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="contoh: Foam Board 5mm"
          className="border-2 border-border bg-transparent h-12"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="material-price" className="text-label text-muted-foreground">
            Harga Est.
          </Label>
          <Input
            id="material-price"
            type="number"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="25000"
            className="border-2 border-border bg-transparent h-12 font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="material-qty" className="text-label text-muted-foreground">
            Jumlah
          </Label>
          <Input
            id="material-qty"
            type="number"
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            className="border-2 border-border bg-transparent h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="material-unit" className="text-label text-muted-foreground">
            Satuan
          </Label>
          <Input
            id="material-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="pcs"
            className="border-2 border-border bg-transparent h-12"
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
      >
        <Plus className="w-4 h-4 mr-2" /> Tambah Bahan
      </Button>
    </form>
  )
}
