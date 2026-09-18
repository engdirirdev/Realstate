import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        // Primary — Emerald
        default:
          "bg-[#10B981] text-white hover:bg-[#059669] shadow-sm",
        // Destructive
        destructive:
          "bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-sm",
        // Secondary — white with border
        outline:
          "border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#CBD5E1]",
        // Muted/secondary
        secondary:
          "bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0]",
        // Ghost
        ghost:
          "bg-transparent text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]",
        // Link
        link:
          "text-[#059669] underline-offset-4 hover:underline bg-transparent",
        // AI — Cyan accent
        ai:
          "bg-[#ECFEFF] text-[#0891B2] border border-[#A5F3FC] hover:bg-[#CFFAFE]",
        // Navy — dark solid
        navy:
          "bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-sm",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm:      "h-9 rounded-lg px-4 text-xs",
        lg:      "h-12 rounded-xl px-7 text-base",
        xl:      "h-13 rounded-xl px-9 text-base",
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
