import React from 'react'
import { motion, useInView } from 'framer-motion'
import { Package, Plus, Check, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { debounce } from 'lodash'

interface TableItem {
  id: string | number
  name: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  price: number
  category: string
  accumulated?: string | number
  parcial?: string | number
  rubro?: string | number
  element_tags?: { tags: { name: string } }[]
}

interface PresupuestoSectionProps {
  tag: string
  tagIndex: number
  items: TableItem[]
  previewVersion: string | boolean
  grandTotal: number
  sectionRubros: number[]
  sectionIacums: number[]
  addElementToSection: (tag: string, element: any) => void
  updateData: (tag: string, itemId: string | number, key: keyof TableItem, value: string) => void
  handleDeleteRow: (tag: string, itemId: string | number) => void
  isNewSection?: boolean
  allElements: any[]
}

function EditableInput({
  value: initialValue,
  onChange,
  suffix = "",
  prefix = "",
}: {
  value: string | number
  onChange: (val: string) => void
  suffix?: string
  prefix?: string
}) {
  const [value, setValue] = React.useState(String(initialValue))

  React.useEffect(() => {
    setValue(String(initialValue))
  }, [initialValue])

  const handleBlur = () => {
    onChange(value)
  }

  return (
    <div className="flex items-center justify-center gap-1">
      {prefix && <span className="text-sm text-gray-700">{prefix}</span>}
      <input
        className="border-b border-transparent group-hover:border-gray-300 group-focus:border-gray-300 focus:outline-none bg-transparent w-[50px] text-right focus-within:border-gray-300"
        value={value}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
      />
      {suffix && <span className="text-sm text-gray-700">{suffix}</span>}
    </div>
  )
}

export function PresupuestoSection({
  tag,
  tagIndex,
  items,
  previewVersion,
  grandTotal,
  sectionRubros,
  sectionIacums,
  addElementToSection,
  updateData,
  handleDeleteRow,
  isNewSection = false,
  allElements
}: PresupuestoSectionProps) {
  // Local states
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')
  const [filteredElements, setFilteredElements] = React.useState<any[]>([])

  // Remove allElements state and fetch
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true })

  // Animation variants
  const containerVariants = {
    hidden: { scale: 1.1, opacity: 0 },
    visible: { scale: 1, opacity: 1 }
  }

  const borderVariants = {
    hidden: { borderColor: 'rgba(59, 130, 246, 0.75)' },
    visible: { borderColor: 'rgba(59, 130, 246, 0)' }
  }

  // Debounced search function
  const debouncedSearch = React.useCallback(
    debounce((searchTerm: string) => {
      if (searchTerm.length >= 4) {
        const filtered = allElements.filter(element => {
          // Name matching - case insensitive
          const searchLower = searchTerm.toLowerCase();
          const nameLower = (element.nombre || element.name || '').toLowerCase();
          const nameMatch = nameLower.includes(searchLower);

          // For custom sections, don't filter by tag
          const isCustomSection = !element.element_tags?.some((tagObj: any) =>
            (tagObj.tags?.name || tagObj.name || '').toLowerCase() === tag.toLowerCase()
          );

          return nameMatch && (isCustomSection || element.category?.toLowerCase() === tag.toLowerCase());
        });

        setFilteredElements(filtered);
      } else {
        setFilteredElements([]);
      }
    }, 300),
    [allElements, tag]
  )

  // Handle search input change
  const handleSearch = (value: string) => {
    setSearchValue(value);
    debouncedSearch(value);
  }

  // Handle element selection
  const handleElementSelect = (element: any) => {
    addElementToSection(tag, element);
    setIsSearchOpen(false);
    setSearchValue('');
    setFilteredElements([]);
  }

  // Handle custom element creation
  const handleCreateCustomElement = () => {
    const customElement = {
      id: `custom-${Date.now()}`,
      nombre: searchValue,
      name: searchValue,
      unidad: '',
      unit: '',
      cantidad: 0,
      quantity: 0,
      precio: 0,
      price: 0,
      category: tag,
    };
    handleElementSelect(customElement);
  }

  // console.log('tag', tag)
  // console.log('isNewSection', isNewSection)
  // console.log('isInView', isInView)
  // console.log('filteredElements', filteredElements)

  return (
    <motion.div
      ref={ref}
      key={tag}
      id={`section-${tag}`}
      initial={isNewSection ? "hidden" : "visible"}
      animate={isNewSection && isInView ? "visible" : "visible"}
      variants={containerVariants}
      transition={{ duration: 1 }}
      className="relative scroll-mt-10"
    >
      <motion.div
        initial={isNewSection ? "hidden" : "visible"}
        animate={isNewSection && isInView ? "visible" : "visible"}
        variants={borderVariants}
        transition={{ duration: 1.5, delay: 0.2 }}
        className={cn(
          "border-2 rounded-lg",
          (!Array.isArray(items) || items.length === 0) && "border-dashed border-muted-foreground/50 bg-muted/50"
        )}
      >
        {/* Section Header */}
        <h3 className={cn(
          "text-[14px] font-bold bg-input/20 rounded-lg p-2 pl-4 flex items-center justify-between gap-2",
          (!Array.isArray(items) || items.length === 0) && "text-muted-foreground"
        )}>
          <span className="flex items-center gap-2">
            <Package size={16} strokeWidth={2} aria-hidden="true" />
            {tagIndex + 1}. {tag.toUpperCase()}
          </span>
          <div className="relative">
            {previewVersion === 'false' && (
              <Popover
                open={isSearchOpen}
                onOpenChange={setIsSearchOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    className={cn(
                      "w-7 h-7 p-0 -my-1"
                    )}
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                  >
                    <Plus className="w-4 h-4 text-blue-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  {/* @ts-ignore */}
                  <Command>
                    {/* @ts-ignore */}
                    <CommandInput
                      // @ts-ignore
                      placeholder="Buscar elementos (mínimo 4 caracteres)..."
                      value={searchValue}
                      onValueChange={handleSearch}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                        }
                      }}
                    />
                    {/* @ts-ignore */}
                    <CommandEmpty>
                      {/* @ts-ignore */}
                      {(!searchValue || searchValue.length < 4) ? (
                        "Ingrese al menos 4 caracteres para buscar"
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 gap-2">
                          <span className="text-sm text-muted-foreground">No se encontraron elementos</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCreateCustomElement}
                            className="mt-2"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Crear "{searchValue}"
                          </Button>
                        </div>
                      )}
                    </CommandEmpty>
                    {/* @ts-ignore */}
                    <CommandGroup>
                      {/* @ts-ignore */}
                      <CommandList>
                        {filteredElements.map((element, idx) => (
                          // @ts-ignore
                          <CommandItem
                            key={element.id}
                            value={element.nombre}
                            onSelect={() => handleElementSelect(element)}
                          >
                            <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                            {element.nombre}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </h3>

        <Table className="bg-white border-l-none">
          {(!Array.isArray(items) || items.length > 0) && (
            <TableHeader>
              <TableRow className="bg-white border-l-none">
                <TableHead className="w-[50px] bg-white">N°</TableHead>
                <TableHead className="text-left bg-white">Nombre</TableHead>
                <TableHead className="text-left bg-white">Unidad</TableHead>
                <TableHead className="text-center bg-white">Cantidad</TableHead>
                <TableHead className="text-center bg-white" colSpan={2}>Precio Unit.</TableHead>
                <TableHead className="text-center bg-white" colSpan={2}>Precio Total</TableHead>
                <TableHead className="text-center bg-white">Parcial</TableHead>
                {previewVersion === 'false' && (
                  <TableHead className="text-center bg-white">Acciones</TableHead>
                )}
              </TableRow>
            </TableHeader>
          )}

          <TableBody>
            {/* Empty state */}
            {(!Array.isArray(items) || items.length === 0) && previewVersion === 'false' && (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Package className="h-8 w-8 opacity-50" />
                    <span className="text-sm">No hay elementos en esta sección</span>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Rows for this tag */}
            {Array.isArray(items) && items.map((item, rowIndex) => {
              const rowNumber = `${tagIndex + 1}.${rowIndex + 1}`
              const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
              const parcialPercentage = grandTotal ? (itemTotal * 100 / grandTotal) : 0;

              return (
                <TableRow key={item.id}>
                  {/* N° */}
                  <TableCell className="text-gray-600 border-r ">
                    {rowNumber}
                  </TableCell>
                  {/* Nombre */}
                  <TableCell className='border-r'>
                    {item.name}
                  </TableCell>
                  {/* Unidad */}
                  <TableCell className='border-r'>
                    <EditableInput
                      value={String(item.unit ?? '')}
                      onChange={(val) => updateData(tag, item.id, 'unit', val)}
                      suffix=""
                    />
                  </TableCell>
                  <TableCell className="text-center border-r group cursor-text hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)]">
                    <EditableInput
                      value={String(item.quantity ?? '')}
                      onChange={(val) => updateData(tag, item.id, 'quantity', val)}
                      suffix=""
                    />
                  </TableCell>
                  <TableCell className="text-center border-r group cursor-text hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)]" colSpan={2}>
                    <EditableInput
                      value={String(item.unitPrice ?? '')}
                      onChange={(val) => updateData(tag, item.id, 'unitPrice', val)}
                      prefix="$"
                    />
                  </TableCell>
                  <TableCell className="text-center border-r" colSpan={2}>
                    ${itemTotal.toFixed(2)}
                  </TableCell>
                  {/* Parcial */}
                  <TableCell className="text-center">
                    {parcialPercentage.toFixed(2)}%
                  </TableCell>
                  {/* Rubro */}
                  {previewVersion === 'false' && (
                    <TableCell className="text-center border-r">
                      <Button
                        variant="destructive"
                        className="flex items-center gap-1 h-6 w-7 p-0 mx-auto"
                        onClick={() => handleDeleteRow(tag, item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}

            {/* Section totals header */}
            {(!Array.isArray(items) || items.length > 0) && (
              <TableRow className="relative hover:bg-white border-none">
                <TableCell colSpan={10} className="p-0">
                </TableCell>
                <TableCell className="p-0 relative h-[100px]">
                  <div className={cn(" right-0 w-[300px] max-w-[300px] absolute top-0 my-4 mr-2 rounded-lg overflow-hidden border border-gray-200 shadow-md")}>
                    <Table >
                      <TableRow className="bg-black text-white hover:bg-black/80 border-r-none">
                        <TableCell className="text-center font-bold border-r">
                          Total ($)
                        </TableCell>
                        {(previewVersion === 'parcial' || previewVersion === 'false') && (
                          <>
                            <TableCell className="text-center font-bold border-r" colSpan={3}>
                              Rubro (%)
                            </TableCell>
                            <TableCell className="text-center font-bold border-r-none" colSpan={4}>
                              IACUMUL (%)
                            </TableCell>
                          </>
                        )}
                      </TableRow>

                      {/* Section totals values */}
                      <TableRow className="bg-black/50 hover:bg-black/35">
                        <TableCell className="text-center font-bold border-r">
                          ${Array.isArray(items) ? items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0).toFixed(2) : '0.00'}
                        </TableCell>
                        {(previewVersion === 'parcial' || previewVersion === 'false') && (
                          <>
                            <TableCell className="text-center font-bold border-r" colSpan={3}>
                              {sectionRubros[tagIndex].toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-center font-bold border-r-none" colSpan={2}>
                              {sectionIacums[tagIndex].toFixed(2)}%
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    </Table>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>
    </motion.div>
  )
} 