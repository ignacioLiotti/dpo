'use client'

import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CustomInput } from '@/components/ui/custom-input'
import { motion } from 'framer-motion'
import { cn } from '@/utils/utils'

interface InvoiceItem {
  description: string
  quantity: number
  price: number
  total: number
}

interface InvoiceFormData {
  invoiceNo: string
  issueDate: string
  dueDate: string
  from: string
  to: string
  items: InvoiceItem[]
  subtotal: number
  vat: number
  tax: number
  total: number
  note: string
}

const emptyItem: InvoiceItem = {
  description: '',
  quantity: 0,
  price: 0,
  total: 0
}

export function InvoiceForm() {
  const form = useForm<InvoiceFormData, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined>({
    defaultValues: {
      invoiceNo: 'INV-0001',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      from: '',
      to: '',
      items: [emptyItem],
      subtotal: 0,
      vat: 0,
      tax: 0,
      total: 0,
      note: ''
    },
    onSubmit: async ({ value }) => {
      console.log('Invoice Data:', value)
    }
  })

  const addItem = () => {
    const currentItems = form.getFieldValue('items')
    form.setFieldValue('items', [...currentItems, emptyItem])
  }

  const removeItem = (index: number) => {
    const currentItems = form.getFieldValue('items')
    form.setFieldValue('items', currentItems.filter((_, i) => i !== index))
  }

  const calculateItemTotal = (quantity: number, price: number) => {
    return quantity * price
  }

  const calculateTotals = () => {
    const items = form.getFieldValue('items')
    const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item.quantity, item.price), 0)
    const vat = subtotal * 0.1 // 10% VAT
    const tax = subtotal * 0.05 // 5% Tax
    const total = subtotal + vat + tax

    form.setFieldValue('subtotal', subtotal)
    form.setFieldValue('vat', vat)
    form.setFieldValue('tax', tax)
    form.setFieldValue('total', total)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-6 p-6"
    >
      <div className="flex flex-col gap-0 ">
        <div className="flex justify-start items-center gap-2">
          <label className="text-xs w-maxcontent font-medium text-primary/60">Invoice No: </label>
          <form.Field
            name="invoiceNo"
            children={(field) => (
              <CustomInput
                value={field.state.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
                variant="default"
                className={cn(
                    'max-w-32',
                    field.state.meta.errors.length ? 'border-red-500' : ''
                )}              />
            )}
          />
        </div>
        <div className="flex justify-start items-center gap-2">
          <label className="text-xs font-medium text-primary/60">Issue Date: </label>
          <form.Field
            name="issueDate"
            children={(field) => (
              <CustomInput
                type="date"
                value={field.state.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
                variant="default"
                className={cn(
                    'max-w-32',
                    field.state.meta.errors.length ? 'border-red-500' : ''
                )}
              />
            )}
          />
        </div>
        <div className="flex justify-start items-center gap-2">
          <label className="text-xs font-medium text-primary/60">Due Date: </label>
          <form.Field
            name="dueDate"
            children={(field) => (
              <CustomInput
                type="date"
                value={field.state.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
                variant="default"
                className={cn(
                    'max-w-32',
                    field.state.meta.errors.length ? 'border-red-500' : ''
                )}              />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">From</label>
          <form.Field
            name="from"
            children={(field) => (
              <CustomInput
                value={field.state.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
                variant="show-empty"
                className={field.state.meta.errors.length ? 'border-red-500' : ''}
              />
            )}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">To</label>
          <form.Field
            name="to"
            children={(field) => (
              <CustomInput
                value={field.state.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
                variant="show-empty"
                className={field.state.meta.errors.length ? 'border-red-500' : ''}
              />
            )}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Items</h3>
          <Button type="button" onClick={addItem} variant="outline">
            Add Item
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <form.Field
              name="items"
              mode="array"
              children={(field) => (
                <>
                  {field.state.value.map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <form.Field
                          name={`items[${index}].description`}
                          children={(subField) => (
                            <CustomInput
                              value={subField.state.value}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => subField.handleChange(e.target.value)}
                              variant="show-empty"
                              className={subField.state.meta.errors.length ? 'border-red-500' : ''}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <form.Field
                          name={`items[${index}].quantity`}
                          children={(subField) => (
                            <CustomInput
                              type="number"
                              value={subField.state.value}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const value = parseFloat(e.target.value) || 0
                                subField.handleChange(value)
                                const price = form.getFieldValue(`items[${index}].price`) || 0
                                form.setFieldValue(`items[${index}].total`, calculateItemTotal(value, price))
                                calculateTotals()
                              }}
                              variant="default"
                              className={subField.state.meta.errors.length ? 'border-red-500' : ''}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <form.Field
                          name={`items[${index}].price`}
                          children={(subField) => (
                            <CustomInput
                              type="number"
                              value={subField.state.value}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const value = parseFloat(e.target.value) || 0
                                subField.handleChange(value)
                                const quantity = form.getFieldValue(`items[${index}].quantity`) || 0
                                form.setFieldValue(`items[${index}].total`, calculateItemTotal(quantity, value))
                                calculateTotals()
                              }}
                              variant="default"
                              className={subField.state.meta.errors.length ? 'border-red-500' : ''}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <form.Field
                          name={`items[${index}].total`}
                          children={(subField) => (
                            <CustomInput
                              type="number"
                              value={subField.state.value}
                              readOnly
                              variant="cammo"
                              className="bg-muted"
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            removeItem(index)
                            calculateTotals()
                          }}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            />
          </TableBody>
        </Table>

        <div className="space-y-2 text-right">
          <div className="flex justify-end gap-4">
            <span className="font-medium">Subtotal:</span>
            <form.Field
              name="subtotal"
              children={(field) => (
                <span>${field.state.value.toFixed(2)}</span>
              )}
            />
          </div>
          <div className="flex justify-end gap-4">
            <span className="font-medium">VAT (10%):</span>
            <form.Field
              name="vat"
              children={(field) => (
                <span>${field.state.value.toFixed(2)}</span>
              )}
            />
          </div>
          <div className="flex justify-end gap-4">
            <span className="font-medium">Tax (5%):</span>
            <form.Field
              name="tax"
              children={(field) => (
                <span>${field.state.value.toFixed(2)}</span>
              )}
            />
          </div>
          <div className="flex justify-end gap-4 text-lg font-bold">
            <span>Total:</span>
            <form.Field
              name="total"
              children={(field) => (
                <span>${field.state.value.toFixed(2)}</span>
              )}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Note</label>
        <form.Field
          name="note"
          children={(field) => (
            <Textarea
              value={field.state.value}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => field.handleChange(e.target.value)}
              className={`rounded-none ${field.state.meta.errors.length ? 'border-red-500' : ''} ${!field.state.value ? 'bg-[repeating-linear-gradient(-60deg,#dbdbdb,#dbdbdb_1px,transparent_1px,transparent_6px)]' : ''}`}
              rows={4}
            />
          )}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit">Submit Invoice</Button>
      </div>
    </form>
  )
} 