import { useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Item {
  name: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  partial_percentage: number;
  total_price: number;
}

interface Section {
  section_name: string;
  section_total: number;
  section_partial_percentage: number;
  section_total_percentage: number;
  items: Item[];
}

interface AddItemsDialogProps {
  sections: Section[];
  onAddItems: (sectionIndex: number, items: Item[]) => void;
}

const SAMPLE_ITEMS: Item[] = [
  {
    name: "Cemento Portland",
    unit: "bolsa",
    quantity: 1,
    unit_price: 0,
    partial_percentage: 0,
    total_price: 0
  },
  {
    name: "Arena Fina",
    unit: "m³",
    quantity: 1,
    unit_price: 0,
    partial_percentage: 0,
    total_price: 0
  },
  {
    name: "Piedra Partida",
    unit: "m³",
    quantity: 1,
    unit_price: 0,
    partial_percentage: 0,
    total_price: 0
  },
  // Add more sample items as needed
];

export function AddItemsDialog({ sections, onAddItems }: AddItemsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItem, setNewItem] = useState<Item>({
    name: "",
    unit: "",
    quantity: 1,
    unit_price: 0,
    partial_percentage: 0,
    total_price: 0
  });

  const filteredItems = SAMPLE_ITEMS.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddItems = () => {
    const sectionIndex = sections.findIndex(s => s.section_name === selectedSection);
    if (sectionIndex === -1) return;

    const itemsToAdd: Item[] = [];

    // Add selected existing items
    filteredItems.forEach(item => {
      if (selectedItems.has(item.name)) {
        itemsToAdd.push({ ...item });
      }
    });

    // Add new item if form is shown and name is not empty
    if (showNewItemForm && newItem.name.trim()) {
      itemsToAdd.push({ ...newItem });
    }

    if (itemsToAdd.length > 0) {
      onAddItems(sectionIndex, itemsToAdd);
      handleClose();
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedSection("");
    setSearchQuery("");
    setSelectedItems(new Set());
    setShowNewItemForm(false);
    setNewItem({
      name: "",
      unit: "",
      quantity: 1,
      unit_price: 0,
      partial_percentage: 0,
      total_price: 0
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar Items al Presupuesto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Sección</Label>
            <Select
              value={selectedSection}
              onValueChange={setSelectedSection}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sección" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section, index) => (
                  <SelectItem key={index} value={section.section_name}>
                    {section.section_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Buscar Items</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <AnimatePresence>
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center space-x-2 py-2"
                >
                  <Checkbox
                    id={item.name}
                    checked={selectedItems.has(item.name)}
                    onCheckedChange={(checked) => {
                      const newSelected = new Set(selectedItems);
                      if (checked) {
                        newSelected.add(item.name);
                      } else {
                        newSelected.delete(item.name);
                      }
                      setSelectedItems(newSelected);
                    }}
                  />
                  <Label htmlFor={item.name} className="flex-1">
                    {item.name}
                    <span className="text-sm text-muted-foreground ml-2">
                      ({item.unit})
                    </span>
                  </Label>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredItems.length === 0 && !showNewItemForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-4"
              >
                <p className="text-sm text-muted-foreground">No se encontraron items</p>
                <Button
                  variant="ghost"
                  className="mt-2"
                  onClick={() => setShowNewItemForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Nuevo Item
                </Button>
              </motion.div>
            )}
          </ScrollArea>

          {showNewItemForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 border rounded-md p-4"
            >
              <h4 className="font-medium">Nuevo Item</h4>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Nombre del item"
                />
              </div>
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Input
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  placeholder="ej: m², m³, kg"
                />
              </div>
            </motion.div>
          )}

          <div className="flex justify-end gap-2">
            {!showNewItemForm && (
              <Button
                variant="outline"
                onClick={() => setShowNewItemForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Item
              </Button>
            )}
            <Button
              onClick={handleAddItems}
              disabled={!selectedSection || (!showNewItemForm && selectedItems.size === 0)}
            >
              <Check className="h-4 w-4 mr-2" />
              Agregar Seleccionados
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 