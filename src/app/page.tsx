import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  if (await isAuthenticated()) {
    redirect("/dashboard");
  }

  redirect("/login");
}
