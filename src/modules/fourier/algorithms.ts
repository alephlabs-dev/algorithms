import { localized } from "@/i18n";
import type { FourierAlgorithm, FourierShape } from "./types";

type SeriesText = {
  title: string;
  /** How the name reads mid-sentence ("build …"); English uses the title in lower case. */
  named?: string;
  /** Short name for tight spots (pickers on phones). */
  short: string;
  shortDescription: string;
  longDescription: string;
  /** The series in one line. */
  formula: string;
  /** What each circle's speed is, in a few words. */
  speeds: string;
};

type SeriesDetails = SeriesText & { named: string };

// Key order is the order shown in the UI.
const text = localized<Record<FourierAlgorithm, SeriesText>>({
  en: {
    square: {
      title: "Square Wave",
      short: "Square",
      shortDescription: "Odd sines, each smaller than the last, stacked as circles. Their sum flattens into a square wave, with a little overshoot at every jump that never goes away.",
      longDescription: "A square wave jumps between +1 and −1. Fourier showed it can be built from sines alone: the sines at 1, 3, 5, 7… times the base frequency, with sizes 4/π, 4/(3π), 4/(5π)… Draw each sine as a circle turning at its speed on the tip of the one before, and the height of the last tip traces the sum. One circle gives a plain sine; a few more square off the top and bottom. Right at each jump the sum overshoots by about 9%, however many circles you add: the Gibbs phenomenon, the price of building a jump out of smooth waves.",
      formula: "(4/π) · Σ sin(nθ)/n, for n = 1, 3, 5, …",
      speeds: "odd speeds: 1, 3, 5…",
    },
    sawtooth: {
      title: "Sawtooth Wave",
      short: "Sawtooth",
      shortDescription: "Every whole-number sine, alternating in sign and shrinking as 1/n. Their sum climbs steadily, then drops: a sawtooth.",
      longDescription: "A sawtooth wave rises in a straight line and drops back at once, like the teeth of a saw. It needs every harmonic, odd and even: sines at 1, 2, 3… times the base frequency with sizes 2/π, 2/(2π), 2/(3π)…, every other one flipped. As circles, the even ones turn the opposite way to start. Few circles give a wobbly ramp; more give a straighter climb and a sharper drop, with the same overshoot as the square wave at the jump. Synthesizers build sounds this way, adding harmonics to a sine.",
      formula: "(2/π) · Σ (−1)ⁿ⁺¹ sin(nθ)/n, for n = 1, 2, 3, …",
      speeds: "every speed: 1, 2, 3…",
    },
    triangle: {
      title: "Triangle Wave",
      short: "Triangle",
      shortDescription: "Odd sines again, but shrinking as 1/n², so they fade fast. A handful of circles already give a near-perfect triangle.",
      longDescription: "A triangle wave goes up and down in straight lines, with corners but no jumps. Its series uses the same odd harmonics as the square wave, but their sizes fall as 1/n² instead of 1/n (8/π², 8/(9π²), 8/(25π²)…), alternating in sign. Because the circles shrink so quickly, three or four already trace it closely, and there's no overshoot: smoother shapes need fewer circles. That's the rule behind compressing sound and images: smooth signals can be kept with few terms.",
      formula: "(8/π²) · Σ (−1)ᵏ sin(nθ)/n², for n = 2k + 1",
      speeds: "odd speeds: 1, 3, 5…",
    },
    epicycles: {
      title: "Fourier Epicycles",
      short: "Epicycles",
      shortDescription: "Any closed drawing can be traced by circles on circles. The discrete Fourier transform finds them; the biggest carry the shape, the small ones the detail.",
      longDescription: "Take a closed drawing and walk along it at an even pace: your position is a point in the plane that comes back where it started. The discrete Fourier transform rewrites that path as a sum of circles, each turning a whole number of times per lap (some clockwise, some anticlockwise), with its own size and starting angle. Chain them tip to tip and the last tip retraces the drawing. Sorted by size, the first few circles give the rough shape and the rest add detail; with as many circles as points sampled, the drawing comes back exactly. The naive transform takes O(N²) steps; the fast Fourier transform does it in O(N log N).",
      formula: "c[k] = (1/N) · Σ z[j] · e^(−2πi·k·j/N)",
      speeds: "every speed, both ways",
    },
  },
  es: {
    square: {
      title: "Onda cuadrada",
      named: "la onda cuadrada",
      short: "Cuadrada",
      shortDescription: "Senos impares, cada uno más pequeño que el anterior, apilados como círculos. Su suma se aplana en una onda cuadrada, con un pequeño exceso en cada salto que nunca desaparece.",
      longDescription: "Una onda cuadrada salta entre +1 y −1. Fourier mostró que se puede construir solo con senos: los senos a 1, 3, 5, 7… veces la frecuencia base, con tamaños 4/π, 4/(3π), 4/(5π)… Dibuja cada seno como un círculo que gira a su velocidad en la punta del anterior, y la altura de la última punta traza la suma. Un círculo da un seno simple; unos pocos más cuadran la parte de arriba y la de abajo. Justo en cada salto la suma se pasa en alrededor de un 9 %, sin importar cuántos círculos agregues: el fenómeno de Gibbs, el precio de armar un salto con ondas suaves.",
      formula: "(4/π) · Σ sen(nθ)/n, para n = 1, 3, 5, …",
      speeds: "velocidades impares: 1, 3, 5…",
    },
    sawtooth: {
      title: "Onda de sierra",
      named: "la onda de sierra",
      short: "Sierra",
      shortDescription: "Todos los senos enteros, alternando el signo y reduciéndose como 1/n. Su suma sube de forma pareja y después cae: un diente de sierra.",
      longDescription: "Una onda de sierra sube en línea recta y vuelve a caer de golpe, como los dientes de una sierra. Necesita todos los armónicos, pares e impares: senos a 1, 2, 3… veces la frecuencia base con tamaños 2/π, 2/(2π), 2/(3π)…, uno sí y uno no invertido. Como círculos, los pares empiezan girando al revés. Pocos círculos dan una rampa ondulada; más dan una subida más recta y una caída más brusca, con el mismo exceso que la onda cuadrada en el salto. Los sintetizadores construyen sonidos así, sumando armónicos a un seno.",
      formula: "(2/π) · Σ (−1)ⁿ⁺¹ sen(nθ)/n, para n = 1, 2, 3, …",
      speeds: "todas las velocidades: 1, 2, 3…",
    },
    triangle: {
      title: "Onda triangular",
      named: "la onda triangular",
      short: "Triangular",
      shortDescription: "Otra vez senos impares, pero reduciéndose como 1/n², así que se apagan rápido. Un puñado de círculos ya da un triángulo casi perfecto.",
      longDescription: "Una onda triangular sube y baja en líneas rectas, con esquinas pero sin saltos. Su serie usa los mismos armónicos impares que la onda cuadrada, pero sus tamaños caen como 1/n² en lugar de 1/n (8/π², 8/(9π²), 8/(25π²)…), alternando el signo. Como los círculos se reducen tan rápido, tres o cuatro ya la trazan de cerca, y no hay exceso: las formas más suaves necesitan menos círculos. Esa es la regla detrás de la compresión de sonido e imágenes: las señales suaves se pueden guardar con pocos términos.",
      formula: "(8/π²) · Σ (−1)ᵏ sen(nθ)/n², para n = 2k + 1",
      speeds: "velocidades impares: 1, 3, 5…",
    },
    epicycles: {
      title: "Epiciclos de Fourier",
      named: "los epiciclos de Fourier",
      short: "Epiciclos",
      shortDescription: "Cualquier dibujo cerrado se puede trazar con círculos sobre círculos. La transformada discreta de Fourier los encuentra; los más grandes llevan la forma y los pequeños, el detalle.",
      longDescription: "Toma un dibujo cerrado y recórrelo a paso parejo: tu posición es un punto del plano que vuelve a donde empezó. La transformada discreta de Fourier reescribe ese camino como una suma de círculos, cada uno girando un número entero de veces por vuelta (unos en sentido horario, otros en antihorario), con su propio tamaño y ángulo inicial. Encadénalos punta con punta y la última punta vuelve a trazar el dibujo. Ordenados por tamaño, los primeros círculos dan la forma general y el resto agrega detalle; con tantos círculos como puntos muestreados, el dibujo vuelve exacto. La transformada ingenua tarda O(N²) pasos; la transformada rápida de Fourier lo hace en O(N log N).",
      formula: "c[k] = (1/N) · Σ z[j] · e^(−2πi·k·j/N)",
      speeds: "todas las velocidades, en ambos sentidos",
    },
  },
});

export const fourierSeries = Object.fromEntries(
  (Object.keys(text) as FourierAlgorithm[]).map((id) => [
    id,
    { ...text[id], named: text[id].named ?? text[id].title.toLowerCase() },
  ])
) as Record<FourierAlgorithm, SeriesDetails>;

export type ShapeOption = { value: FourierShape; label: string; title: string };

/** The drawings to pick from, in groups. */
export const shapeGroups = localized<{ label: string; shapes: ShapeOption[] }[]>({
  en: [
    {
      label: "Shapes",
      shapes: [
        { value: "heart", label: "Heart", title: "A smooth curve: few circles do" },
        { value: "star", label: "Star", title: "Sharp points need more circles" },
        { value: "infinity", label: "Infinity", title: "A figure eight that crosses itself" },
        { value: "square", label: "Square", title: "Corners: watch the circles round them off" },
      ],
    },
    {
      label: "Sky",
      shapes: [
        { value: "crux", label: "Southern Cross", title: "Crux: four bright stars, the southern sky's compass" },
        { value: "orion", label: "Orion", title: "The hunter, with his belt of three stars" },
        { value: "dipper", label: "Big Dipper", title: "The saucepan in the Great Bear" },
        { value: "cassiopeia", label: "Cassiopeia", title: "The W of the queen" },
      ],
    },
    {
      label: "Drawings",
      shapes: [
        { value: "aleph", label: "Aleph", title: "ℵ, as in Aleph Labs" },
        { value: "butterfly", label: "Butterfly", title: "Temple Fay's butterfly curve" },
        { value: "fish", label: "Fish", title: "The fish curve" },
        { value: "cat", label: "Cat", title: "A cat's head, ears and all" },
        { value: "note", label: "Note", title: "A musical note" },
        { value: "bolt", label: "Lightning", title: "A lightning bolt: all corners" },
      ],
    },
  ],
  es: [
    {
      label: "Formas",
      shapes: [
        { value: "heart", label: "Corazón", title: "Una curva suave: alcanzan pocos círculos" },
        { value: "star", label: "Estrella", title: "Las puntas filosas necesitan más círculos" },
        { value: "infinity", label: "Infinito", title: "Un ocho que se cruza consigo mismo" },
        { value: "square", label: "Cuadrado", title: "Esquinas: mira cómo los círculos las redondean" },
      ],
    },
    {
      label: "Cielo",
      shapes: [
        { value: "crux", label: "Cruz del Sur", title: "Crux: cuatro estrellas brillantes, la brújula del cielo austral" },
        { value: "orion", label: "Orión", title: "El cazador, con su cinturón de tres estrellas" },
        { value: "dipper", label: "Osa Mayor", title: "El cazo de la Osa Mayor" },
        { value: "cassiopeia", label: "Casiopea", title: "La W de la reina" },
      ],
    },
    {
      label: "Dibujos",
      shapes: [
        { value: "aleph", label: "Aleph", title: "ℵ, como en Aleph Labs" },
        { value: "butterfly", label: "Mariposa", title: "La curva mariposa de Temple Fay" },
        { value: "fish", label: "Pez", title: "La curva del pez" },
        { value: "cat", label: "Gato", title: "La cabeza de un gato, con orejas y todo" },
        { value: "note", label: "Nota", title: "Una nota musical" },
        { value: "bolt", label: "Rayo", title: "Un rayo: todo esquinas" },
      ],
    },
  ],
});

const custom = localized({
  en: { option: "Draw your own", title: "Draw your own shape in one stroke", label: "Your drawing" },
  es: { option: "Dibuja el tuyo", title: "Dibuja tu propia forma de un solo trazo", label: "Tu dibujo" },
});

export const shapeOptions: ShapeOption[] = [
  ...shapeGroups.flatMap((g) => g.shapes),
  { value: "custom", label: custom.option, title: custom.title },
];

export const shapeLabel = (shape: FourierShape) =>
  shape === "custom" ? custom.label : shapeOptions.find((s) => s.value === shape)!.label;
