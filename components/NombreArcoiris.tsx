// © 2026 Santiago López García y Oscar Julián Mojica Calderón. Ver el archivo LICENSE.

/**
 * Muestra un texto con cada letra de un color distinto, y esos colores van
 * rotando de forma continua (una onda de colores que recorre el nombre).
 * Cada letra usa la misma animación pero con un desfase distinto.
 */
export default function NombreArcoiris({ texto }: { texto: string }) {
  return (
    <span aria-label={texto}>
      {[...texto].map((letra, i) =>
        letra === " " ? (
          " "
        ) : (
          <span
            key={i}
            aria-hidden="true"
            className="letra-arcoiris"
            style={{ animationDelay: `-${(i * 0.4).toFixed(2)}s` }}
          >
            {letra}
          </span>
        )
      )}
    </span>
  );
}
