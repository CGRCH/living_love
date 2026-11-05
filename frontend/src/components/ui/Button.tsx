"use client";

import clsx from "clsx";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "outline" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  full?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", full, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center px-6 py-3 text-[11px] font-medium uppercase tracking-label transition",
        full && "w-full",
        variant === "primary" && "bg-onix text-blanco hover:bg-grafito",
        variant === "outline" &&
          "border border-onix bg-transparent text-onix hover:bg-onix hover:text-blanco",
        variant === "ghost" && "text-onix underline-offset-4 hover:underline",
        props.disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
