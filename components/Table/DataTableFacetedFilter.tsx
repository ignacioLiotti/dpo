// tableComponent/Components/DataTableFacetedFilter.tsx
import * as React from "react"
import { Column } from "@tanstack/react-table"
import { Label } from "../ui/label.tsx"
import { CheckIcon, PlusCircleIcon } from "lucide-react"
import { Button } from "../ui/button.tsx"
import { Badge } from "../ui/badge.tsx"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command.tsx"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover.tsx"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group.tsx"
import { Separator } from "../ui/separator.tsx"
import { cn } from "@/lib/utils.ts"

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options: {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
  onResetFilters: () => void // Add this new prop

}

export default function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  onResetFilters, // Add this new prop

}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues()
  // const selectedValues = new Set(column?.getFilterValue() as string[])
  const [selectedValues, setSelectedValues] = React.useState(new Set());

  React.useEffect(() => {
    // Initialize selectedValues based on column's filter value
    const initialFilterValue = column?.getFilterValue() as string[] | undefined;
    if (initialFilterValue && Array.isArray(initialFilterValue)) {
      setSelectedValues(new Set(initialFilterValue));
    }
  }, [column]);

  const handleSelect = (value: string) => {
    const newSelectedValues = new Set(selectedValues);
    if (newSelectedValues.has(value)) {
      newSelectedValues.delete(value);
    } else {
      if (options.length === 2) {
        // If there are only two options, clear the previous selection
        newSelectedValues.clear();
      }
      newSelectedValues.add(value);
    }
    setSelectedValues(newSelectedValues);
    const filterValues = Array.from(newSelectedValues);
    column?.setFilterValue(filterValues.length ? filterValues : undefined);
  };

  // Add this effect to listen for filter resets
  React.useEffect(() => {
    const handleReset = () => {
      setSelectedValues(new Set());
    };

    // Call handleReset directly when onResetFilters is called
    onResetFilters();

    return () => {
      // No cleanup needed since we're not registering a callback
    };
  }, [onResetFilters]);

  const renderCheckbox = () => (
    // @ts-ignore
    <CommandList>
      {/* @ts-ignore */}
      <CommandEmpty>No results found.</CommandEmpty>
      {/* @ts-ignore */}
      <CommandGroup>
        {/* @ts-ignore */}
        <CommandInput placeholder={title} />

        {options.map((option) => {
          const isSelected = selectedValues.has(option.value);
          return (
            // @ts-ignore
            <CommandItem
              key={option.value}
              onSelect={() => handleSelect(option.value)}
            >
              <div
                className={cn(
                  "tw-mr-2 tw-flex tw-h-4 tw-w-4 tw-items-center tw-justify-center tw-rounded-sm tw-border tw-border-primary",
                  isSelected
                    ? "tw-bg-primary tw-text-primary-foreground"
                    : "tw-opacity-50 [&_svg]:tw-invisible"
                )}
              >
                <CheckIcon className={cn("tw-h-4 tw-w-4")} />
              </div>
              {option.icon && (
                <option.icon className="tw-mr-2 tw-h-4 tw-w-4 tw-text-muted-foreground" />
              )}
              <span>{option.label}</span>
              {facets?.get(option.value) && (
                <span className="tw-ml-auto tw-flex tw-h-4 tw-w-4 tw-items-center tw-justify-center tw-font-mono tw-text-xs">
                  {facets.get(option.value)}
                </span>
              )}
            </CommandItem>
          );
        })}
      </CommandGroup>
    </CommandList>
  );

  const renderRadioGroup = ({ options, selectedValues, handleSelect }: { options: any, selectedValues: any, handleSelect: any }) => {
    return (
      <RadioGroup className="tw-flex tw-flex-col tw-py-2" value={[...selectedValues].length > 0 ? [...selectedValues][0] : ''}>
        {options.map((option: any) => (
          <div key={option.value} className="tw-flex tw-items-center tw-space-x-2 tw-px-3 tw-py-2">
            <RadioGroupItem onClick={() => handleSelect(option.value)} value={option.value} id={`radio-${option.value}`} />
            {option.icon && (
              <option.icon className="tw-mr-2 tw-h-4 tw-w-4 tw-text-muted-foreground" />
            )}
            <Label className="tw-flex tw-flex-1" htmlFor={`radio-${option.value}`}>{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="tw-h-8 tw-border-dashed">
          <PlusCircleIcon className="lg:tw-mr-2 lg:tw-h-4 lg:tw-w-4 tw-h-5 tw-w-5" />
          <span className="tw-hidden lg:tw-flex">
            {title}
          </span>
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="tw-mx-2 tw-h-4" />
              <Badge
                variant="secondary"
                className="tw-rounded-sm tw-px-1 tw-font-normal lg:tw-hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="tw-hidden tw-space-x-1 lg:tw-flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="tw-rounded-sm tw-px-1 tw-font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="tw-rounded-sm tw-px-1 tw-font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="tw-w-[200px] tw-p-0 tw-bg-background" align="start">
        {/* @ts-ignore */}
        <Command>
          {options.length === 2 ? renderRadioGroup({ options, selectedValues, handleSelect }) : renderCheckbox()}

        </Command>
      </PopoverContent>
    </Popover>
  )
}