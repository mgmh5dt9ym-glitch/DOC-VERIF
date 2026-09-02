import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/admin-auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "Connexion — Admin" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await verifyAdminSession()) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold">Espace administrateur</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Saisissez le mot de passe pour gérer les documents.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
