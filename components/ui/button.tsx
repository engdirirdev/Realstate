import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6A536]/45 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary — Luxury Gold (#D6A536) with Deep Navy (#0B1728) Text
        default:
          "bg-gradient-to-r from-[#D6A536] via-[#E2B952] to-[#C29124] text-[#0B1728] font-bold hover:brightness-105 shadow-sm hover:shadow-md hover:shadow-[#D6A536]/25 border-0",
        // Destructive — Refined Crimson
        destructive:
          "bg-[#991B1B] text-white hover:bg-[#7F1D1D] shadow-sm font-semibold",
        // Secondary — Crisp White with Soft Beige border & Deep Navy text
        secondary:
          "border border-[#E8E1D5] bg-white text-[#0B1728] hover:bg-[#F5F1E8] hover:border-[#D6A536]/70 font-semibold shadow-xs",
        // Outline — Gold border and text
        outline:
          "border border-[#D6A536] bg-transparent text-[#0B1728] hover:bg-[#D6A536]/12 font-semibold",
        // Ghost
        ghost:
          "bg-transparent text-[#5F6C7B] hover:bg-[#F5F1E8] hover:text-[#0B1728]",
        // Link
        link:
          "text-[#B88A24] underline-offset-4 hover:underline bg-transparent font-semibold",
        // AI Assistant — Deep Navy & Gold Accent
        ai:
          "bg-[#0B1728] text-[#D6A536] border border-[#D6A536]/45 hover:bg-[#13233A] shadow-sm font-bold",
        // Navy — Deep Navy Solid
        navy:
          "bg-[#0B1728] text-white hover:bg-[#13233A] shadow-sm font-semibold",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm:      "h-9 rounded-lg px-4 text-xs",
        lg:      "h-12 rounded-xl px-7 text-base",
        xl:      "h-14 rounded-xl px-9 text-base",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
