
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

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

export type ComboboxOption = {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyResultText?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyResultText = "No results found.",
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  // Find the selected option based on the current value, case-insensitive
  const selectedOption = options.find(
    (option) => option.value?.toLowerCase() === value?.toLowerCase()
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : (value || placeholder)}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command
          // Optional: Custom filter if needed, though Command default filter is usually good.
          // filter={(itemValue, search) => {
          //   const option = options.find(opt => opt.value.toLowerCase() === itemValue.toLowerCase());
          //   if (option?.label.toLowerCase().includes(search.toLowerCase())) return 1;
          //   // if (itemValue.toLowerCase().includes(search.toLowerCase())) return 1; // If value itself should be searchable
          //   return 0;
          // }}
        >
          <CommandInput
            placeholder={searchPlaceholder}
            value={value} // Directly use and control RHF's field value
            onValueChange={onChange} // Directly update RHF's field value on type
          />
          <CommandList>
            <CommandEmpty>{emptyResultText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value} // This value is used by Command for filtering and onSelect
                  onSelect={(currentValue) => {
                    // currentValue is the 'value' prop of the CommandItem that was selected.
                    // We ensure to pass the original casing from options if a match is found,
                    // or the currentValue (which might be a newly typed value if Command allows it)
                    const matchedOption = options.find(opt => opt.value.toLowerCase() === currentValue.toLowerCase());
                    onChange(matchedOption ? matchedOption.value : currentValue);
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.toLowerCase() === option.value.toLowerCase()
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
