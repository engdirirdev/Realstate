import { redirect } from "next/navigation";

export default function ManagerFavoritesRedirect() {
  redirect("/dashboard/properties");
}
