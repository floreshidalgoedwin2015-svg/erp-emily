import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

// Redireciona automaticamente:
// → Se logada: vai pro dashboard
// → Se não logada: vai pro login
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
