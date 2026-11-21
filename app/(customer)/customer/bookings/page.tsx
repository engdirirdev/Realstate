import { redirect } from "next/navigation";

export default function CustomerBookingsRedirectPage() {
  redirect("/customer/requests");
}
