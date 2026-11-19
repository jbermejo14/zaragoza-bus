import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FECHA_TEXTOS_LEGALES } from '@/lib/legal';
import { absoluteUrl, SITE_NAME } from '@/lib/site';

const RUTA = '/cookies';

export const metadata: Metadata = {
  title: 'Política de cookies',
  description: `Qué almacenamiento local usa ${SITE_NAME} y cómo gestionarlo.`,
  robots: { index: false, follow: true },
  alternates: { canonical: absoluteUrl(RUTA) }
};

export default function CookiesPage() {
  return (
    <main className="main-wrapper">
      <Breadcrumbs
        items={[
          { name: 'Inicio', url: '/' },
          { name: 'Cookies', url: RUTA }
        ]}
      />
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">Política de cookies</h1>
      <div className="card legal-text">
        <h2>Qué son las cookies</h2>
        <p>
          Las cookies y tecnologías similares (como el almacenamiento local del navegador) guardan pequeños datos en tu dispositivo. Se regulan en el artículo 22.2 de la LSSI y en la Guía sobre el uso de las cookies de la AEPD.
        </p>

        <h2>Qué usa esta web</h2>
        <div className="table-responsive mb-4">
          <table className="guide-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Finalidad</th>
                <th>Tipo</th>
                <th>Caducidad</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>zarabus:favorites</code> (localStorage)</td>
                <td>Recordar las paradas que marcas como favoritas. Solo se guarda en tu navegador.</td>
                <td>Técnica, exenta de consentimiento</td>
                <td>Sin caducidad</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Esta web no instala cookies, no usa cookies de terceros, no usa cookies de análisis y no muestra publicidad, por lo que no necesita pedirte consentimiento. El mapa carga sus teselas desde los servidores de OpenStreetMap: esas peticiones no instalan cookies en tu dispositivo, aunque el servidor recibe tu dirección IP.
        </p>

        <h2>Borrar los datos desde el navegador</h2>
        <p>
          Puedes bloquear o eliminar las cookies y el almacenamiento local desde los ajustes de privacidad de tu navegador. Si borras <code>zarabus:favorites</code>, perderás tu lista de paradas favoritas.
        </p>

        <p className="text-xs text-muted">Última revisión: {FECHA_TEXTOS_LEGALES}</p>
      </div>
    </main>
  );
}
