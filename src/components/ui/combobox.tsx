
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
  const [inputValue, setInputValue] = React.useState(value || "") // Local state for input

  // Sync inputValue with the external value prop
  React.useEffect(() => {
    setInputValue(value || "")
  }, [value])

  const selectedOption = options.find(
    (option) => option.value?.toLowerCase() === inputValue?.toLowerCase()
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
          {selectedOption ? selectedOption.label : (inputValue || placeholder)}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command
          filter={(itemValue, search) => {
            const option = options.find(opt => opt.value.toLowerCase() === itemValue.toLowerCase());
            if (option?.label.toLowerCase().includes(search.toLowerCase())) return 1;
            if (itemValue.toLowerCase().includes(search.toLowerCase())) return 1; 
            return 0;
          }}
        >
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue} 
            onValueChange={(currentSearchValue) => {
              setInputValue(currentSearchValue); // Update local input state
              onChange(currentSearchValue); // Propagate change for free-form input
            }}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue && !options.some(opt => opt.label.toLowerCase().includes(inputValue.toLowerCase())) 
                ? `No results. Press Enter to add "${inputValue}"` 
                : emptyResultText}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value} 
                  onSelect={(currentValue) => {
                    const matchedOption = options.find(opt => opt.value.toLowerCase() === currentValue.toLowerCase());
                    const finalValue = matchedOption ? matchedOption.value : currentValue;
                    setInputValue(finalValue); // Update local input state
                    onChange(finalValue); // Propagate change
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
