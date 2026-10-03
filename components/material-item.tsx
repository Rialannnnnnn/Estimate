'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Material } from '@/lib/types'
import { formatCurrency, parseCurrencyInput } from '@/lib/budget'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, Edit2, Check, X, Plus, Minus } from 'lucide-react'

interface MaterialItemProps {
  material: Material
  index?: number
  onUpdate: (material: Material) => void
  onDelete: (id: string) => void
}

export function MaterialItem({ material, index = 0, onUpdate, onDelete }: MaterialItemProps) {
  const unitPrice = material.unitPrice ?? 0
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(material.name)
  const [editCategory, setEditCategory] = useState(material.category ?? '')
  const [editQuantity, setEditQuantity] = useState(material.quantity.toString())
  const [editPrice, setEditPrice] = useState(unitPrice.toString())
  const [actualPriceInput, setActualPriceInput] = useState(
    material.actualPrice?.toString() ?? ''
  )

  const handlePurchaseToggle = (checked: boolean) => {
    onUpdate({
      ...material,
      isPurchased: checked,
      actualPrice: checked ? (material.actualPrice ?? unitPrice) : null,
    })
    if (checked && material.actualPrice == null) {
      setActualPriceInput(unitPrice.toString())
    }
  }

  const handleActualPriceChange = (value: string) => {
    setActualPriceInput(value)
    const parsed = parseCurrencyInput(value)
    onUpdate({
      ...material,
      actualPrice: parsed,
    })
  }

  const handleQuantityChange = (delta: number) => {
    const newQty = Math.max(1, material.quantity + delta)
    onUpdate({
      ...material,
      quantity: newQty,
    })
  }

  const handleSaveEdit = () => {
    onUpdate({
      ...material,
      name: editName.trim() || material.name,
      category: editCategory.trim() || 'item',
      quantity: Math.max(1, Number(editQuantity) || 1),
      unitPrice: parseCurrencyInput(editPrice),
    })
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditName(material.name)
    setEditCategory(material.category ?? '')
    setEditQuantity(material.quantity.toString())
    setEditPrice(unitPrice.toString())
    setIsEditing(false)
  }

  const totalPrice = material.isPurchased && material.actualPrice != null
    ? material.actualPrice * material.quantity
    : unitPrice * material.quantity

  if (isEditing) {
    return (
      <div className="bg-card p-6 border border-border/50">
        <div className="space-y-4">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Nama bahan"
            className="border-2 border-border bg-transparent h-12"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              placeholder="Kategori / satuan"
              className="border-2 border-border bg-transparent h-12"
            />
            <Input
              type="number"
              min="1"
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              placeholder="Kuantitas"
              className="border-2 border-border bg-transparent h-12"
            />
            <Input
            type="number"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            placeholder="Harga estimasi"
            className="border-2 border-border bg-transparent h-12 font-mono"
            />
          </div>
          <p className="text-xs text-muted-foreground">Ubah nama barang, kategori atau satuan, jumlah, dan harga estimasi kapan saja.</p>
          <div className="flex gap-2">
            <Button 
              onClick={handleSaveEdit} 
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-10"
            >
              <Check className="w-4 h-4 mr-1" /> Simpan
            </Button>
            <Button 
              onClick={handleCancelEdit} 
              variant="outline" 
              className="flex-1 border-2 border-border h-10"
            >
              <X className="w-4 h-4 mr-1" /> Batal
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-card p-6 border border-border/50 transition-all group',
        material.isPurchased && 'bg-success/10 border-l-4 border-l-success'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <Checkbox
          id={`material-${material.id}`}
          checked={material.isPurchased}
          onCheckedChange={handlePurchaseToggle}
          className="mt-1 border-2 border-primary data-[state=checked]:bg-success data-[state=checked]:border-success"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-mono-sm text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              <label
                htmlFor={`material-${material.id}`}
                className={cn(
                  'block font-semibold text-foreground cursor-pointer mt-1',
                  material.isPurchased && 'line-through text-muted-foreground'
                )}
              >
                {material.name}
              </label>
            </div>
            
            {/* Total Price */}
            <span className="font-mono font-bold text-lg text-foreground">
              {formatCurrency(totalPrice)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">
            <span className="text-mono-sm text-muted-foreground">
              {formatCurrency(unitPrice)}/{material.category || 'item'}
            </span>
            
            {/* Quantity Control */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 border border-border hover:bg-secondary"
                onClick={() => handleQuantityChange(-1)}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-8 text-center font-mono text-foreground">{material.quantity}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 border border-border hover:bg-secondary"
                onClick={() => handleQuantityChange(1)}
              >
                <Plus className="w-3 h-3" />
              </Button>
              <span className="text-mono-sm text-muted-foreground">unit</span>
            </div>

            {/* Actions */}
            <div className="flex gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => material.id && onDelete(material.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Actual Price Input (shown when purchased) */}
          {material.isPurchased && (
            <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-3">
              <span className="text-label text-muted-foreground">Harga Asli</span>
              <Input
                type="number"
                inputMode="numeric"
                value={actualPriceInput}
                onChange={(e) => handleActualPriceChange(e.target.value)}
                className="w-36 h-9 text-sm border-2 border-success bg-transparent font-mono"
                placeholder="Harga asli"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
