import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "Connexion — Admin" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold">Espace administrateur</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Connectez-vous pour gérer les documents vérifiables.
        </p>
        {error === "config" && (
          <p className="mt-4 rounded-md border border-danger/30 bg-red-50 px-3 py-2 text-sm text-danger">
            Variables Supabase manquantes. Vérifiez la configuration du projet.
          </p>
        )}
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
