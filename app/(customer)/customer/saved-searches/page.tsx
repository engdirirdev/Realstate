import { redirect } from "next/navigation";

export default function CustomerSavedSearchesRedirect() {
  redirect("/customer/properties");
}
