import { redirect } from "next/navigation";

export default function CustomerInquiriesRedirect() {
  redirect("/customer/messages");
}
