import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getTitular, valorOPendiente, FECHA_TEXTOS_LEGALES, type Titular } from '@/lib/legal';
import { absoluteUrl, SITE_NAME } from '@/lib/site';

const RUTA = '/privacidad';
const URL_AEPD = 'https://www.aepd.es';
const URL_OPENSTREETMAP_PRIVACY = 'https://osmfoundation.org/wiki/Privacy_Policy';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: `Cómo trata ${SITE_NAME} los datos personales conforme al RGPD.`,
  robots: { index: false, follow: true },
  alternates: { canonical: absoluteUrl(RUTA) }
};

export default function PrivacidadPage() {
  const titular = getTitular();
  const dato = (campo: keyof Titular) => valorOPendiente(titular, campo);

  return (
    <main className="main-wrapper">
      <Breadcrumbs
        items={[
          { name: 'Inicio', url: '/' },
          { name: 'Privacidad', url: RUTA }
        ]}
      />
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">Política de privacidad</h1>
      <div className="card legal-text">
        <h2>Responsable del tratamiento</h2>
        <p>
          Responsable: {dato('nombre')}, con NIF {dato('nif')} y domicilio en {dato('domicilio')}. Contacto: {dato('email')}.
        </p>

        <h2>Qué datos se tratan</h2>
        <p>
          Esta web no tiene formularios ni cuentas de usuario, no usa publicidad y no emplea cookies de terceros.
        </p>
        <ul>
          <li>
            Correo electrónico: si nos escribes, usamos tu mensaje y tu dirección para responderte. La base jurídica es el interés legítimo o tu solicitud.
          </li>
          <li>
            Registros técnicos del servidor: el proveedor de alojamiento (Cloudflare) puede registrar la dirección IP y datos técnicos de la visita por motivos de seguridad. La base jurídica es el interés legítimo.
          </li>
          <li>
            Paradas favoritas: se guardan solo en el almacenamiento local de tu navegador (<code>zarabus:favorites</code>). No se envían a ningún servidor.
          </li>
          <li>
            Ubicación: si usas el botón «Buscar paradas cerca de mí», el navegador te pide permiso para conocer tu posición. Se usa solo en tu navegador para ordenar las paradas por distancia: no se envía ni se guarda.
          </li>
          <li>
            Tiempos de paso: al abrir una parada, tu navegador pide los tiempos al servidor de Ododex (Cloudflare), que los consulta a su vez a Avanza Zaragoza o a DNDzgz enviando únicamente el número de poste. Esa consulta no incluye datos personales.
          </li>
          <li>
            Listado de paradas y recorridos: tu navegador los pide directamente a la API de datos abiertos del Ayuntamiento de Zaragoza, que recibe tu dirección IP como cualquier servidor web.
          </li>
          <li>
            Mapa: las teselas las sirve OpenStreetMap, por lo que su servidor recibe tu dirección IP y la zona que consultas, igual que en cualquier otro mapa de OpenStreetMap. Consulta su política de privacidad en <a href={URL_OPENSTREETMAP_PRIVACY} target="_blank" rel="noopener noreferrer">osmfoundation.org</a>.
          </li>
        </ul>

        <h2>Plazos de conservación</h2>
        <p>
          Los correos se conservan el tiempo necesario para atender tu consulta y, después, durante los plazos legales de posible responsabilidad. Los registros técnicos se conservan según la política del proveedor de alojamiento. Los favoritos permanecen en tu navegador hasta que los borres o limpies sus datos.
        </p>

        <h2>Tus derechos</h2>
        <p>
          Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad escribiendo a {dato('email')}, indicando el derecho que ejercitas.
        </p>

        <h2>Reclamaciones</h2>
        <p>
          Si crees que se han vulnerado tus derechos, puedes reclamar ante la Agencia Española de Protección de Datos (AEPD): <a href={URL_AEPD} target="_blank" rel="noopener noreferrer">aepd.es</a>.
        </p>

        <p className="text-xs text-muted">Última revisión: {FECHA_TEXTOS_LEGALES}</p>
      </div>
    </main>
  );
}
