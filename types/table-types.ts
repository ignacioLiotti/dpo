export interface Item {
  id: string
  insumos: string
  unidad: string
  precio: string
  subItems?: Item[]
}

export type SortDirection = 'asc' | 'desc'

