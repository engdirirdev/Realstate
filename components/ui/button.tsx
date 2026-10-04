import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B3C]/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        // Primary — Luxury Gold with Dark Navy Text & Gold Glow
        default:
          "bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold hover:opacity-95 shadow-md shadow-[#C89B3C]/15 border-0",
        // Destructive — Subtle Red
        destructive:
          "bg-[#991B1B] text-white hover:bg-[#7F1D1D] shadow-sm font-semibold",
        // Secondary — Ivory/white surface with gold border & navy text
        secondary:
          "border border-[#C89B3C]/50 bg-[#FCFBF7] text-[#07111F] hover:bg-[#F7F3EA] hover:border-[#C89B3C] font-semibold shadow-xs",
        // Outline — Transparent/white with gold border and gold text
        outline:
          "border border-[#C89B3C] bg-transparent text-[#C89B3C] hover:bg-[#C89B3C]/10 font-semibold",
        // Ghost
        ghost:
          "bg-transparent text-[#6B7280] hover:bg-[#F7F3EA] hover:text-[#07111F]",
        // Link
        link:
          "text-[#C89B3C] underline-offset-4 hover:underline bg-transparent font-semibold",
        // AI Assistant — Deep Navy & Gold Accent
        ai:
          "bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40 hover:bg-[#0B1728] shadow-sm font-bold",
        // Navy — Luxury Dark Navy Solid
        navy:
          "bg-[#07111F] text-[#FCFBF7] hover:bg-[#0B1728] shadow-sm font-semibold",
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
