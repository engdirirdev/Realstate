import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-[#D1FAE5] text-[#065F46]",
        secondary:   "border-transparent bg-[#F1F5F9] text-[#334155]",
        destructive: "border-transparent bg-[#FEE2E2] text-[#991B1B]",
        outline:     "text-[#0F172A] border-[#E2E8F0] bg-transparent",
        success:     "border-transparent bg-[#DCFCE7] text-[#166534]",
        warning:     "border-transparent bg-[#FEF9C3] text-[#854D0E]",
        info:        "border-transparent bg-[#ECFEFF] text-[#0891B2]",
        navy:        "border-transparent bg-[#F1F5F9] text-[#0F172A]",
        pending:     "border-transparent bg-[#FEF9C3] text-[#92400E]",
        approved:    "border-transparent bg-[#D1FAE5] text-[#065F46]",
        rejected:    "border-transparent bg-[#FEE2E2] text-[#991B1B]",
        sold:        "border-transparent bg-[#DBEAFE] text-[#1E40AF]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
