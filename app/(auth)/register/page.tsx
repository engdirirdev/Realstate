// ================================================================
// PAGE NAME  : Master Register Page — Kiro-Maal Real Estate
// ROUTE      : /register
// PALETTE    : Deep Navy (#07111F), Luxury Gold (#C89B3C), Cream (#F7F3EA)
// DESCRIPTION: Shares unified master auth system with initialTab="register".
//              Zero scroll, sleek tabbed switching, full functionality.
// ================================================================
import { redirect } from "next/navigation";

export default function RegisterPage() {
  // Seamlessly redirect to the unified auth page with register tab active
  redirect("/login?tab=register");
}
