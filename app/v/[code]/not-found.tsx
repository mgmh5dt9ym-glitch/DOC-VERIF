export default function DocumentNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-ink">Document introuvable</h1>
        <p className="mt-2 text-ink-soft">
          Ce lien de vérification n’est plus disponible.
        </p>
      </div>
    </main>
  );
}
