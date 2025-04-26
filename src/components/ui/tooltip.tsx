import * as React from 'react'
import { Popover } from '@headlessui/react'

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button as={React.Fragment}>
            {children}
          </Popover.Button>

          <Popover.Panel
            static
            className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-sm 
              -translate-x-1/2 -translate-y-full -top-2 left-1/2 whitespace-nowrap
              ${open ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
          >
            {content}
            <div className="absolute left-1/2 -translate-x-1/2 top-full">
              <div className="border-4 border-transparent border-t-gray-900" />
            </div>
          </Popover.Panel>
        </>
      )}
    </Popover>
  )
} 