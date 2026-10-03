export interface Material {
  id?: string
  name: string
  category: string
  quantity: number
  unitPrice: number
  actualPrice?: number | null
  isPurchased?: boolean
}

export interface Project {
  id: string
  name: string
  templateType: string
  budgetLimit: number
  materials: Material[]
  createdAt: string
  updatedAt: string
}

export type BudgetStatus = 'safe' | 'warning' | 'danger'
