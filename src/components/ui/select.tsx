import * as React from "react"
import { Listbox } from "@headlessui/react"
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface SelectProps {
  value: string | number
  onChange: (value: string | number) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: boolean
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className,
  error
}: SelectProps) {
  const selectedOption = options.find(option => option.value === value)

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <Listbox.Button
          className={cn(
            "relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500",
            !error && "border-gray-200",
            className
          )}
        >
          <span className="block truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {options.map((option) => (
            <Listbox.Option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={({ active, selected, disabled }) =>
                cn(
                  "relative cursor-default select-none py-2 pl-10 pr-4",
                  active && "bg-primary/5",
                  selected && "bg-primary/10",
                  disabled && "opacity-50 cursor-not-allowed"
                )
              }
            >
              {({ selected }) => (
                <>
                  <span className={cn("block truncate", selected && "font-medium")}>
                    {option.label}
                  </span>
                  {selected && (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  )}
                </>
              )}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  )
} 