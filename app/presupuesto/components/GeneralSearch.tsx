import React, { useState, useCallback, memo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandList, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import { debounce } from 'lodash';
import { cn } from "@/lib/utils";

export const GeneralSearch = memo(({
  allElements,
  existingItems,
  onAddElement
}: {
  allElements: any[];
  existingItems: any[];
  onAddElement: (element: any, tag?: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filteredElements, setFilteredElements] = useState<any[]>([]);

  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      if (searchTerm.length >= 2) {
        const filtered = allElements.filter(element =>
          element.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !existingItems.some(existing => existing.id === element.id)
        );
        setFilteredElements(filtered);
      } else {
        setFilteredElements([]);
      }
    }, 300),
    [allElements, existingItems]
  );

  const handleSearch = (value: string) => {
    setSearchValue(value);
    debouncedSearch(value);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className="fixed bottom-4 right-4 rounded-full w-12 h-12 p-0 shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        {/* @ts-ignore */}
        <Command>
          {/* @ts-ignore */}
          <CommandInput
            // @ts-ignore
            placeholder="Buscar en todos los elementos..."
            value={searchValue}
            onValueChange={handleSearch}
          />
          {/* @ts-ignore */}
          <CommandEmpty>
            {searchValue.length < 4
              ? "Ingrese al menos 4 caracteres"
              : "No se encontraron elementos"}
          </CommandEmpty>
          {/* @ts-ignore */}
          <CommandGroup>
            {/* @ts-ignore */}
            <CommandList>
              {filteredElements.map((element: any) => (
                // @ts-ignore
                <CommandItem
                  key={element.id}
                  onSelect={() => {
                    onAddElement(element);
                    setOpen(false);
                    setSearchValue('');
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                  {element.name}
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}); 