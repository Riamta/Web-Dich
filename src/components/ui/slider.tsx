import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: number) => void;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, onValueChange, onChange, ...props }, ref) => (
    <input
      type="range"
      ref={ref}
      className={cn(
        "h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200",
        "bg-gradient-to-r from-primary to-primary bg-no-repeat",
        "[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5",
        "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
        "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary",
        "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:transition-all",
        "[&::-webkit-slider-thumb]:hover:scale-110",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
        className
      )}
      style={{
        backgroundSize: `${(Number(props.value || 0) - Number(props.min || 0)) * 100 / (Number(props.max || 100) - Number(props.min || 0))}% 100%`
      }}
      onChange={(e) => {
        onChange?.(e);
        onValueChange?.(Number(e.target.value));
      }}
      {...props}
    />
  )
) 