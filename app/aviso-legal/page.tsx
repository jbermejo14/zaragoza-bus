import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getTitular, valorOPendiente, FECHA_TEXTOS_LEGALES, type Titular } from '@/lib/legal';
import { absoluteUrl, SITE_NAME } from '@/lib/site';

const RUTA = '/aviso-legal';
const URL_OPENSTREETMAP_COPYRIGHT = 'https://www.openstreetmap.org/copyright';
const URL_DATOS_ABIERTOS_ZARAGOZA = 'https://www.zaragoza.es/sede/portal/datos-abiertos/';

export const metadata: Metadata = {
  title: 'Aviso legal',
  description: `Aviso legal e información del titular de ${SITE_NAME} conforme al artículo 10 de la LSSI.`,
  robots: { index: false, follow: true },
  alternates: { canonical: absoluteUrl(RUTA) }
};

export default function AvisoLegalPage() {
  const titular = getTitular();
  const dato = (campo: keyof Titular) => valorOPendiente(titular, campo);

  return (
    <main className="main-wrapper">
      <Breadcrumbs
        items={[
          { name: 'Inicio', url: '/' },
          { name: 'Aviso legal', url: RUTA }
        ]}
      />
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">Aviso legal</h1>
      <div className="card legal-text">
        <h2>Datos del titular</h2>
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI), se informa de que el titular de este sitio web es:
        </p>
        <ul>
          <li>Titular: {dato('nombre')}</li>
          <li>NIF: {dato('nif')}</li>
          <li>Domicilio: {dato('domicilio')}</li>
          <li>Correo electrónico de contacto: {dato('email')}</li>
          {titular.tipo === 'empresa' && <li>Datos del Registro Mercantil: {dato('registroMercantil')}</li>}
        </ul>

        <h2>Objeto del sitio</h2>
        <p>
          {SITE_NAME} ofrece información sobre los autobuses urbanos de Zaragoza: un buscador de paradas por número de poste o por calle, los tiempos estimados de llegada, un mapa de paradas y el recorrido de cada línea. El listado de paradas y los trazados proceden de los datos abiertos del Ayuntamiento de Zaragoza. Los tiempos de paso se obtienen de la web pública de Avanza Zaragoza, con respaldo en DNDzgz y en la API municipal.
        </p>

        <h2>Carácter independiente y orientativo</h2>
        <p>
          Este sitio es independiente. No es una web del Ayuntamiento de Zaragoza, de Avanza ni de ninguna otra administración u operador de transporte. Los tiempos son estimaciones del operador y pueden variar por el tráfico o por incidencias. Si todas las fuentes fallan, la aplicación muestra datos simulados y lo indica con la etiqueta «Demo»: no los uses para planificar un viaje.
        </p>

        <h2>Limitación de responsabilidad</h2>
        <p>
          El titular procura que los datos sean correctos y estén actualizados, pero no garantiza su exactitud, su disponibilidad ni su vigencia. No se responsabiliza de las decisiones tomadas ni de los perjuicios derivados del uso de la información, como perder un autobús.
        </p>

        <h2>Propiedad intelectual y datos de terceros</h2>
        <p>
          Los textos, el diseño, el código, el logotipo y demás contenidos del sitio son propiedad del titular o se usan con autorización, y están protegidos por la normativa de propiedad intelectual. No se permite su reproducción, distribución o transformación sin permiso expreso, salvo para uso personal y citando la fuente.
        </p>
        <p>
          Las teselas del mapa son © colaboradores de OpenStreetMap y se publican bajo la licencia abierta ODbL 1.0 (<a href={URL_OPENSTREETMAP_COPYRIGHT} target="_blank" rel="noopener noreferrer">openstreetmap.org/copyright</a>). Los datos de paradas y líneas proceden del portal de <a href={URL_DATOS_ABIERTOS_ZARAGOZA} target="_blank" rel="noopener noreferrer">datos abiertos del Ayuntamiento de Zaragoza</a>, y los trazados de las líneas son de 2013, por lo que pueden no reflejar los recorridos actuales.
        </p>

        <h2>Enlaces a terceros</h2>
        <p>
          El sitio puede enlazar a páginas de terceros, como OpenStreetMap o el portal de datos abiertos del Ayuntamiento. El titular no controla esos sitios ni responde de su contenido o de sus políticas.
        </p>

        <h2>Legislación aplicable</h2>
        <p>
          Este aviso se rige por la legislación española. Para cualquier controversia serán competentes los juzgados y tribunales que correspondan conforme a la normativa aplicable.
        </p>

        <p className="text-xs text-muted">Última revisión: {FECHA_TEXTOS_LEGALES}</p>
      </div>
    </main>
  );
}
