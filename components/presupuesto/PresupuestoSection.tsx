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
  originalUnit?: string
  originalQuantity?: number
  originalUnitPrice?: number
  targetSection?: string
  nombre?: string
  anterior?: number
  presente?: number
  acumulado?: number
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
  highlightChanges?: boolean
}

function EditableInput({
  value: initialValue,
  onChange,
  suffix = "",
  prefix = "",
  originalValue,
  highlightChanges = false,
}: {
  value: string | number
  onChange: (val: string) => void
  suffix?: string
  prefix?: string
  originalValue?: string | number
  highlightChanges?: boolean
}) {
  const [value, setValue] = React.useState(String(initialValue))
  const originalValueRef = React.useRef(originalValue)
  const hasChanged = originalValueRef.current !== undefined && String(originalValueRef.current) !== String(initialValue)
  const shouldHighlight = highlightChanges && hasChanged
  const hiddenSpanRef = React.useRef<HTMLSpanElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setValue(String(initialValue))
  }, [initialValue])

  const handleBlur = () => {
    onChange(value)
  }

  return (
    <div className={cn("flex items-center justify-center gap-1 h-full flex-grow relative group", shouldHighlight && "bg-yellow-100")}>
      {prefix && <span className="text-sm text-gray-700">{prefix}</span>}
      <div className="relative">
        <input
          ref={inputRef}
          className={cn(
            "border-b border-transparent group-hover:border-gray-300 group-focus:border-gray-300 focus:outline-none bg-transparent text-right focus-within:border-gray-300 w-[20px] min-w-0",
          )}
          value={value}
          style={{ width: hiddenSpanRef.current ? `${hiddenSpanRef.current.offsetWidth + 4}px` : 'auto' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
        />
        <span
          ref={hiddenSpanRef}
          className="invisible absolute top-0 left-0 whitespace-pre"
          style={{
            font: 'inherit',
            position: 'absolute',
            padding: '0',
            border: '0',
            whiteSpace: 'pre'
          }}
        >
          {value}
        </span>
      </div>
      {suffix && <span className="text-sm text-gray-700">{suffix}</span>}
      {shouldHighlight && (
        <div className="absolute invisible group-hover:visible bg-black text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
          Original: {originalValueRef.current}
        </div>
      )}
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
  allElements,
  highlightChanges = true,
}: PresupuestoSectionProps) {
  // Remove local states for search
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

  console.log(sectionRubros)
  console.log(sectionIacums)

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
        </h3>

        <Table className="bg-white border-l-none">
          {(!Array.isArray(items) || items.length > 0) && (
            <TableHeader>
              <TableRow className="bg-white border-l-none">
                <TableHead className="w-[50px] bg-white">N°</TableHead>
                <TableHead className="text-left bg-white">Nombre</TableHead>
                {previewVersion !== 'medicion' ? (
                  <>
                    <TableHead className="text-left bg-white">Unidad</TableHead>
                    <TableHead className="text-center bg-white">Cantidad</TableHead>
                    <TableHead className="text-center bg-white" colSpan={2}>Precio Unit.</TableHead>
                    <TableHead className="text-center bg-white" colSpan={2}>Precio Total</TableHead>
                    <TableHead className="text-center bg-white">Parcial</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-center bg-white">Anterior</TableHead>
                    <TableHead className="text-center bg-white">Presente</TableHead>
                    <TableHead className="text-center bg-white">Acumulado a la Fecha</TableHead>
                  </>
                )}
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
              const itemTotal = ((item.quantity || 0) * (item.unitPrice || 0));
              const parcialPercentage = grandTotal ? ((itemTotal * 100) / grandTotal) : 0;

              return (
                <TableRow key={item.id}>
                  {/* N° */}
                  <TableCell className="text-gray-600 border-r">
                    {rowNumber}
                  </TableCell>
                  {/* Nombre */}
                  <TableCell className='border-r'>
                    {item.name}
                  </TableCell>
                  {previewVersion !== 'medicion' ? (
                    <>
                      {/* Regular view columns */}
                      <TableCell className='border-r'>
                        <EditableInput
                          value={String(item.unit ?? '')}
                          originalValue={item.unit}
                          onChange={(val) => updateData(tag, item.id, 'unit', val)}
                          suffix=""
                          highlightChanges={highlightChanges}
                        />
                      </TableCell>
                      <TableCell className="text-center border-r group cursor-text hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)]">
                        <EditableInput
                          value={String(item.quantity ?? '')}
                          originalValue={item.quantity}
                          onChange={(val) => updateData(tag, item.id, 'quantity', val)}
                          suffix=""
                          highlightChanges={false}
                        />
                      </TableCell>
                      <TableCell className="text-center border-r group cursor-text hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)]" colSpan={2}>
                        <EditableInput
                          value={String(item.unitPrice ?? '')}
                          originalValue={item.unitPrice}
                          onChange={(val) => updateData(tag, item.id, 'unitPrice', val)}
                          prefix="$"
                          highlightChanges={highlightChanges}
                        />
                      </TableCell>
                      <TableCell className="text-center border-r" colSpan={2}>
                        ${(itemTotal || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {(parcialPercentage || 0).toFixed(2)}%
                      </TableCell>
                    </>
                  ) : (
                    <>
                      {/* Medición view columns */}
                      <TableCell className="text-center border-r group cursor-text hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)]">
                        <EditableInput
                          value={String(item.anterior ?? 0)}
                          originalValue={item.anterior}
                          onChange={(val) => updateData(tag, item.id, 'anterior', val)}
                          suffix=""
                          highlightChanges={false}
                        />
                      </TableCell>
                      <TableCell className="text-center border-r group cursor-text hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)]">
                        <EditableInput
                          value={String(item.presente ?? 0)}
                          originalValue={item.presente}
                          onChange={(val) => updateData(tag, item.id, 'presente', val)}
                          suffix=""
                          highlightChanges={false}
                        />
                      </TableCell>
                      <TableCell className="text-center border-r">
                        {((item.anterior || 0) + (item.presente || 0)).toFixed(2)}
                      </TableCell>
                    </>
                  )}
                  {previewVersion === 'false' && (
                    <TableCell className="text-center border-r border-l">
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
                  <div className={cn(" right-0 w-[300px] max-w-[300px] absolute top-0 my-4 mr-2 rounded-lg border border-gray-200 shadow-md")}>
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