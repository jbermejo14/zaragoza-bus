import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="main-wrapper">
      <div className="card text-center max-w-2xl mx-auto py-16">
        <div className="text-6xl font-extrabold text-accent mb-4">404</div>
        <h1 className="text-2xl font-bold mb-3">Página no encontrada</h1>
        <p className="text-muted mb-8 text-sm">
          La página solicitada no existe o ha cambiado de dirección.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/" className="btn btn-secondary">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
