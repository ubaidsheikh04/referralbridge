
"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, value, ...props }, ref) => {
    // Create a props object to pass to the native input element
    const finalInputProps: React.InputHTMLAttributes<HTMLInputElement> = {
      className: cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      ),
      ref: ref,
      type: type,
      ...props, // Spread other props like onChange, onBlur, name, disabled, accept etc.
    };

    // For input types other than "file", we set the value attribute.
    // For "file" inputs, the `value` attribute should not be programmatically set with the FileList.
    // The browser handles displaying the selected file name, and react-hook-form tracks the FileList.
    if (type !== "file") {
      finalInputProps.value = value ?? '';
    }
    // If type is "file", finalInputProps.value will remain undefined (if it was undefined in `props`),
    // which is the correct behavior for an <input type="file" /> in React when its
    // selection is managed by a form library.

    return <input {...finalInputProps} />;
  }
)
Input.displayName = "Input"

export { Input }
