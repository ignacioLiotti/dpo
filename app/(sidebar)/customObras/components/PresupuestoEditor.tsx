"use client";

import { useForm } from "@tanstack/react-form";
import { motion } from "framer-motion";
import { Package, Plus, Trash2 } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Obra } from "@/utils/types/presupuesto";
import { usePresupuestoCalculations } from "../hooks/usePresupuestoCalculations";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/utils";
import { AddItemsDialog } from "./AddItemsDialog";

interface PresupuestoItem {
  name: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  partial_percentage: number;
  total_price: number;
}

interface PresupuestoSection {
  section_name: string;
  section_total: number;
  section_partial_percentage: number;
  section_total_percentage: number;
  items: PresupuestoItem[];
}

interface PresupuestoFormData {
  presupuesto_name: string;
  grand_total: number;
  sections: PresupuestoSection[];
}

interface PresupuestoEditorProps {
  obra: Obra;
  onSubmit: (values: PresupuestoFormData) => Promise<void>;
  initialData?: PresupuestoFormData;
}

export function PresupuestoEditor({ obra, onSubmit: onSubmitProp, initialData }: PresupuestoEditorProps) {
  const form = useForm<PresupuestoFormData>({
    defaultValues: initialData || {
      presupuesto_name: "",
      grand_total: 0,
      sections: [{
        section_name: "Sección 1",
        section_total: 0,
        section_partial_percentage: 0,
        section_total_percentage: 0,
        items: [{
          name: "",
          unit: "",
          quantity: 1,
          unit_price: 0,
          partial_percentage: 0,
          total_price: 0
        }]
      }]
    },
    onSubmit: async ({ value }) => {
      await onSubmitProp(value);
    },
    validators: {
      onChangeListenTo: ["grand_total"],
      onChange: ({ value }) => {
        // When grand_total changes, update all partial percentages
        const grandTotal = value.grand_total;
        if (grandTotal > 0) {
          let accumulatedPercentage = 0;

          value.sections.forEach((section, sectionIndex) => {
            // Calculate section's total percentage
            const sectionPercentage = (section.section_total / grandTotal) * 100;
            accumulatedPercentage += sectionPercentage;

            // Update section percentages
            form.setFieldValue(
              `sections.${sectionIndex}.section_partial_percentage`,
              sectionPercentage
            );
            form.setFieldValue(
              `sections.${sectionIndex}.section_total_percentage`,
              accumulatedPercentage
            );

            // Update individual item percentages
            section.items.forEach((item, itemIndex) => {
              if (item.total_price) {
                form.setFieldValue(
                  `sections.${sectionIndex}.items.${itemIndex}.partial_percentage`,
                  (item.total_price / grandTotal) * 100
                );
              }
            });
          });
        }
        return undefined;
      }
    }
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    }} className="relative pb-24">
      <div className="space-y-8 max-w-[1000px] flex-1 min-w-[50vw] p-6 bg-white rounded-xl shadow-lg relative border">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Ministerio de Obras y Servicios Públicos
          </h1>
          <Card className="text-gray-600 flex flex-col justify-center items-start p-2 px-4">
            <p className="mb-2">{`Obra: `}
              <b>
                {obra.nombre}
                <span className="text-xs text-gray-500 ml-2">
                  ID: {obra.id}
                </span>
              </b>
            </p>
            <p>{`Localidad: `}
              <b>
                {obra.localidad}
              </b>
            </p>
          </Card>

          <h2 className="mt-4 text-lg font-bold uppercase underline">
            Planilla de Presupuesto e Incidencias
          </h2>
        </div>

        <form.Field name="presupuesto_name">
          {(field) => (
            <div className="space-y-2">
              <Label>Nombre del Presupuesto</Label>
              <Input
                variant="cammo"
                placeholder="ej: Presupuesto Inicial"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="sections" mode="array">
          {(sectionsField) => (
            <div className="space-y-6">
              {sectionsField.state.value.map((_, sectionIndex) => (
                <motion.div
                  key={sectionIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className={cn(
                      "text-[14px] font-bold bg-input/20 rounded-lg p-2 pl-4 flex items-center justify-between gap-2",
                      (!Array.isArray(sectionsField.state.value) || sectionsField.state.value.length === 0) && "text-muted-foreground"
                    )}>
                      <span className="flex items-center gap-2">
                        <Package size={16} strokeWidth={2} aria-hidden="true" />
                        <form.Field
                          name={`sections.${sectionIndex}.section_name`}
                        >
                          {(field) => (
                            <Input
                              variant="cammo"
                              className="w-full md:text-sm h-6"
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                            />
                          )}
                        </form.Field>
                      </span>
                      <div className="relative">
                        {sectionsField.state.value.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            className={cn(
                              "w-7 h-7 p-0 -my-1"
                            )}
                            onClick={() => sectionsField.removeValue(sectionIndex)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </h3>

                    <form.Field
                      name={`sections.${sectionIndex}.items`}
                      mode="array"
                    >
                      {(itemsField) => (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className=" bg-white">N°</TableHead>
                                <TableHead className="text-left bg-white w-[300px]">Nombre</TableHead>
                                <TableHead className="text-left bg-white">Unidad</TableHead>
                                <TableHead className="text-center bg-white">Cantidad</TableHead>
                                <TableHead className="text-center bg-white" >Precio Unit.</TableHead>
                                <TableHead className="text-center bg-white" >Precio Total</TableHead>
                                <TableHead className="text-center bg-white">Parcial</TableHead>
                                <TableHead className="text-center bg-white"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {itemsField.state.value.map((_, itemIndex) => {
                                const itemPath = `sections.${sectionIndex}.items.${itemIndex}`;
                                return (
                                  <TableRow key={itemIndex}>
                                    <TableCell>{`${sectionIndex + 1}.${itemIndex + 1}`}</TableCell>
                                    <TableCell className="p-0">
                                      <form.Field
                                        name={`${itemPath}.name`}
                                      >
                                        {(field) => (
                                          <Input
                                            variant="cell"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="text-left"
                                          />
                                        )}
                                      </form.Field>
                                    </TableCell>
                                    <TableCell className="text-left p-0">
                                      <form.Field
                                        name={`${itemPath}.unit`}
                                      >
                                        {(field) => (
                                          <Input
                                            variant="cell"
                                            value={field.state.value || "c/u"}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="text-left"
                                          />
                                        )}
                                      </form.Field>
                                    </TableCell>
                                    <TableCell className="text-center p-0">
                                      <form.Field
                                        name={`${itemPath}.quantity`}
                                        listeners={{
                                          onChange: ({ value }) => {
                                            if (value !== undefined) {
                                              const unitPrice = form.getFieldValue(`${itemPath}.unit_price`) as number;
                                              const totalPrice = value * unitPrice;
                                              form.setFieldValue(`${itemPath}.total_price`, totalPrice);

                                              // Update section total
                                              const items = form.getFieldValue(`sections.${sectionIndex}.items`) as PresupuestoItem[];
                                              const sectionTotal = items.reduce((acc, item) => acc + (item.total_price || 0), 0);
                                              form.setFieldValue(`sections.${sectionIndex}.section_total`, sectionTotal);

                                              // Update grand total
                                              const sections = form.getFieldValue('sections') as PresupuestoSection[];
                                              const grandTotal = sections.reduce((acc, section) => acc + (section.section_total || 0), 0);
                                              form.setFieldValue('grand_total', grandTotal);

                                              // Update partial percentage
                                              if (grandTotal > 0) {
                                                form.setFieldValue(`${itemPath}.partial_percentage`, (totalPrice / grandTotal) * 100);
                                              }
                                            }
                                          },
                                        }}
                                      >
                                        {(field) => (
                                          <Input
                                            variant="cell"
                                            value={field.state.value || 1}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                          />
                                        )}
                                      </form.Field>
                                    </TableCell>
                                    <TableCell className="text-center p-0">
                                      <form.Field
                                        name={`${itemPath}.unit_price`}
                                        listeners={{
                                          onChange: ({ value }) => {
                                            if (value !== undefined) {
                                              const quantity = form.getFieldValue(`${itemPath}.quantity`) as number;
                                              const totalPrice = value * quantity;
                                              form.setFieldValue(`${itemPath}.total_price`, totalPrice);

                                              // Update section total
                                              const items = form.getFieldValue(`sections.${sectionIndex}.items`) as PresupuestoItem[];
                                              const sectionTotal = items.reduce((acc, item) => acc + (item.total_price || 0), 0);
                                              form.setFieldValue(`sections.${sectionIndex}.section_total`, sectionTotal);

                                              // Update grand total
                                              const sections = form.getFieldValue('sections') as PresupuestoSection[];
                                              const grandTotal = sections.reduce((acc, section) => acc + (section.section_total || 0), 0);
                                              form.setFieldValue('grand_total', grandTotal);

                                              // Update partial percentage
                                              if (grandTotal > 0) {
                                                form.setFieldValue(`${itemPath}.partial_percentage`, (totalPrice / grandTotal) * 100);
                                              }
                                            }
                                          },
                                        }}
                                      >
                                        {(field) => (
                                          <Input
                                            variant="cell"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                          />
                                        )}
                                      </form.Field>
                                    </TableCell>
                                    <TableCell className="text-center p-0">
                                      <form.Field
                                        name={`${itemPath}.total_price`}
                                      >
                                        {(field) => (
                                          <Input
                                            variant="cell"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                            disabled
                                          />
                                        )}
                                      </form.Field>
                                    </TableCell>
                                    <TableCell className="text-center p-0">
                                      <form.Field
                                        name={`${itemPath}.partial_percentage`}
                                      >
                                        {(field) => (
                                          <Input
                                            variant="cell"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                            disabled
                                          />
                                        )}
                                      </form.Field>
                                    </TableCell>
                                    <TableCell className="text-center p-0">
                                      {itemIndex > 0 && (
                                        <Button
                                          type="button"
                                          variant="destructiveSecondary"
                                          size="icon"
                                          onClick={() => itemsField.removeValue(itemIndex)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </>
                      )}
                    </form.Field>
                    <div className="flex justify-end">
                      <div className="flex justify-center w-[40%] bg-primary rounded-lg text-white shadow-md">
                        <form.Field name={`sections.${sectionIndex}.section_total`}>
                          {(field) => (
                            <div className="flex items-center justify-end flex-col h-full w-full border-r border-white">
                              <p className="text-md text-white w-full p-2 text-center">Total $</p>
                              <p className="text-lg font-semibold bg-white w-full text-center rounded-bl-lg">
                                <Input variant="cammo" disabled className="text-black border-none outline-none text-xl md:text-2xl w-full text-center" type="number" value={field.state.value} />
                              </p>
                            </div>
                          )}
                        </form.Field>
                        <form.Field name={`sections.${sectionIndex}.section_partial_percentage`}>
                          {(field) => (
                            <div className="flex items-center justify-end flex-col h-full w-full border-r border-white">
                              <p className="text-md text-white p-2 w-full text-center">Rubro %</p>
                              <p className="text-lg font-semibold bg-white w-full text-center">
                                <Input variant="cammo" disabled className="text-black border-none outline-none text-xl md:text-2xl w-full text-center" type="number" value={field.state.value} />
                              </p>
                            </div>
                          )}
                        </form.Field>

                        <form.Field name={`sections.${sectionIndex}.section_total_percentage`}>
                          {(field) => (
                            <div className="flex items-center justify-end flex-col h-full w-full">
                              <p className="text-md text-white p-2 w-full text-center">Acumulado %</p>
                              <p className="text-lg font-semibold bg-white w-full text-center rounded-br-lg">
                                <Input variant="cammo" disabled className="text-black border-none outline-none text-xl md:text-2xl w-full text-center" type="number" value={field.state.value} />
                              </p>
                            </div>
                          )}
                        </form.Field>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="grand_total">
          {(field) => (
            <div className="space-y-1 text-right">
              <p className="text-sm text-muted-foreground">Total General</p>
              <Input variant="cammo" disabled className="md:text-4xl font-semibold text-end" value={field.state.value} onChange={(e) => field.handleChange(Number(e.target.value))} />
            </div>
          )}
        </form.Field>
      </div>

      {/* Sticky Footer with Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
        <div className="max-w-[1000px] mx-auto flex items-center justify-between">
          <div className="flex gap-4">
            <form.Field name="sections" mode="array">
              {(sectionsField) => (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    sectionsField.pushValue({
                      section_name: `Sección ${sectionsField.state.value.length + 1}`,
                      section_total: 0,
                      section_partial_percentage: 0,
                      section_total_percentage: 0,
                      items: [{
                        name: "",
                        unit: "",
                        quantity: 0,
                        unit_price: 0,
                        partial_percentage: 0,
                        total_price: 0
                      }]
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Sección
                </Button>
              )}
            </form.Field>
            <AddItemsDialog
              sections={form.getFieldValue('sections')}
              onAddItems={(sectionIndex, items) => {
                const currentItems = form.getFieldValue(`sections.${sectionIndex}.items`) as PresupuestoItem[];
                items.forEach(item => {
                  currentItems.push({
                    name: item.name,
                    unit: item.unit || "",
                    quantity: 0,
                    unit_price: 0,
                    partial_percentage: 0,
                    total_price: 0
                  });
                });
                form.setFieldValue(`sections.${sectionIndex}.items`, currentItems);
              }}
            />
          </div>

          <Button type="submit" variant="default">
            Guardar Presupuesto
          </Button>
        </div>
      </div>
    </form>
  );
} 