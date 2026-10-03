import type { Project } from './types'

const STORAGE_KEY = 'estimate_projects'

export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

export function getProjects(): Project[] {
  if (typeof window === 'undefined' || !isLocalStorageAvailable()) {
    return []
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    return JSON.parse(data) as Project[]
  } catch {
    return []
  }
}

export function saveProject(project: Project): void {
  if (typeof window === 'undefined' || !isLocalStorageAvailable()) {
    return
  }
  
  try {
    const projects = getProjects()
    const existingIndex = projects.findIndex(p => p.id === project.id)
    
    if (existingIndex >= 0) {
      projects[existingIndex] = { ...project, updatedAt: new Date().toISOString() }
    } else {
      projects.push(project)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  } catch (error) {
    console.error('[v0] Failed to save project:', error)
  }
}

export function deleteProject(projectId: string): void {
  if (typeof window === 'undefined' || !isLocalStorageAvailable()) {
    return
  }
  
  try {
    const projects = getProjects()
    const filtered = projects.filter(p => p.id !== projectId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('[v0] Failed to delete project:', error)
  }
}

export function getProjectById(projectId: string): Project | null {
  const projects = getProjects()
  return projects.find(p => p.id === projectId) ?? null
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
