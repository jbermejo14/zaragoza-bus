/** Texto breve bajo la app: qué hace el servicio, de dónde salen los datos y sus límites. */
export default function AboutSection() {
  return (
    <section className="about-section" aria-labelledby="about-heading">
      <h2 id="about-heading">Sobre este servicio</h2>
      <p>
        Autobús de Zaragoza te dice cuándo llega el próximo bus a tu parada. Busca por número de poste o por nombre de calle, filtra por línea, mira las paradas en el mapa, dibuja el recorrido de una línea y guarda tus paradas favoritas en este dispositivo.
      </p>
      <p>
        El listado de paradas procede de los datos abiertos del Ayuntamiento de Zaragoza. Los tiempos de paso se consultan a través del servidor de Ododex en la web pública de Avanza Zaragoza, con respaldo en DNDzgz y en la API municipal. Si ninguna fuente responde, la aplicación muestra datos simulados y lo indica con la etiqueta «Demo».
      </p>
      <p>
        Las posiciones de los autobuses que se acercan a la parada salen del sistema público de localización de Avanza, consultado por el servidor de Ododex sin enviar ningún dato tuyo, y pueden tener retraso.
      </p>
      <p>
        Los tiempos son estimaciones del operador y pueden variar por el tráfico o por incidencias. Ododex es un sitio independiente: no es una web del Ayuntamiento de Zaragoza ni de Avanza.
      </p>
    </section>
  );
}
