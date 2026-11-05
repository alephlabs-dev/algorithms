import { localized } from "@/i18n";
import type { Algorithm } from "@/types";

type AlgorithmText = {
  title: string;
  shortDescription: string;
  longDescription: string;
  /** What the yellow highlight means for this algorithm, if it uses it. */
  tempLabel?: string;
};

type AlgorithmData = {
  timeComplexity: {
    best: string;
    average: string;
    worst: string;
  };
  /** Extra memory beyond the array itself. */
  space: string;
  /** Keeps equal values in their original order. */
  stable: boolean;
  /** The algorithm moves values by writing them rather than swapping (merge, radix). */
  countsWrites?: boolean;
};

type AlgorithmDetails = AlgorithmText & AlgorithmData;

// Key order is the order shown in the UI; keep it in sync with `sortAlgorithms`.

const data: Record<Algorithm, AlgorithmData> = {
  selection: {
    space: "O(1)",
    stable: false,
    timeComplexity: { best: "O(n²)", average: "O(n²)", worst: "O(n²)" },
  },
  insertion: {
    space: "O(1)",
    stable: true,
    timeComplexity: { best: "O(n)", average: "O(n²)", worst: "O(n²)" },
  },
  bubble: {
    space: "O(1)",
    stable: true,
    timeComplexity: { best: "O(n)", average: "O(n²)", worst: "O(n²)" },
  },
  cocktail: {
    space: "O(1)",
    stable: true,
    timeComplexity: { best: "O(n)", average: "O(n²)", worst: "O(n²)" },
  },
  shell: {
    space: "O(1)",
    stable: false,
    timeComplexity: { best: "O(n log n)", average: "O(n^1.5)", worst: "O(n²)" },
  },
  quick: {
    space: "O(log n)",
    stable: false,
    timeComplexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n²)" },
  },
  merge: {
    space: "O(n)",
    stable: true,
    timeComplexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)" },
    countsWrites: true,
  },
  heap: {
    space: "O(1)",
    stable: false,
    timeComplexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)" },
  },
  radix: {
    space: "O(n + k)",
    stable: true,
    timeComplexity: { best: "O(d·n)", average: "O(d·n)", worst: "O(d·n)" },
    countsWrites: true,
  },
};

const text = localized<Record<Algorithm, AlgorithmText>>({
  en: {
    selection: {
      title: "Selection Sort",
      shortDescription:
        "Efficient for small datasets, minimizing swaps, but performs poorly on larger or nearly sorted datasets due to its O(n²) complexity.",
      longDescription:
        "Selection Sort is a basic algorithm that works by repeatedly selecting the smallest unsorted element and moving it to the sorted portion of the list. It’s simple and minimizes swaps, which is beneficial when memory writes are costly. However, with an O(n²) time complexity, it becomes inefficient on larger datasets or nearly sorted arrays, making it more suitable for small collections.",
    },
    insertion: {
      title: "Insertion Sort",
      shortDescription:
        "Efficient for small or nearly sorted datasets, with a best-case O(n) time complexity, but inefficient for larger, random datasets.",
      longDescription:
        "Insertion Sort is a simple algorithm that builds a sorted array one element at a time. It’s efficient on small or nearly sorted datasets, achieving a best-case O(n) time complexity. However, its O(n²) complexity in average and worst cases makes it less suitable for large, random datasets. The algorithm iteratively places each item into its proper place within the sorted portion of the array.",
      tempLabel: "Sorted section",
    },
    bubble: {
      title: "Bubble Sort",
      shortDescription:
        "Ideal for nearly sorted datasets, simple to implement, but highly inefficient on large unsorted arrays due to its O(n²) complexity.",
      longDescription:
        "Bubble Sort is a straightforward algorithm that repeatedly steps through the list, compares adjacent elements, and swaps them if necessary. It’s best suited for nearly sorted arrays, where its best-case time complexity is O(n). Despite its simplicity, Bubble Sort is inefficient for large datasets, as its average and worst-case complexities are both O(n²).",
    },
    cocktail: {
      title: "Cocktail Shaker Sort",
      shortDescription:
        "A two-way Bubble Sort that also moves small values left, so it handles nearly sorted data well, but it's still O(n²) on average.",
      longDescription:
        "Cocktail Shaker Sort is a variation of Bubble Sort that sweeps through the list in both directions: a forward pass carries the largest value to the end, and a backward pass carries the smallest value to the front. This fixes Bubble Sort's weakness with small values stuck near the end (the “turtles”), and it stops as soon as a pass makes no swaps, giving a best case of O(n). Its average and worst cases remain O(n²), so it's mostly useful on small or nearly sorted arrays.",
    },
    shell: {
      title: "Shell Sort",
      shortDescription:
        "An Insertion Sort on items far apart first, then closer and closer, which moves values long distances early and is much faster in practice.",
      longDescription:
        "Shell Sort generalizes Insertion Sort by first sorting items that are a large gap apart, then shrinking the gap until it reaches 1, where it becomes a regular Insertion Sort on an almost sorted array. Moving values across long distances early saves a lot of work later. Its performance depends on the gap sequence: with the simple halving gaps used here it runs in roughly O(n^1.5) on average and O(n²) in the worst case, while using no extra memory.",
      tempLabel: "Same gap group",
    },
    quick: {
      title: "Quick Sort",
      shortDescription:
        "Fast and efficient for most cases, with an average time complexity of O(n log n), though pivot choice can sometimes lead to suboptimal performance.",
      longDescription:
        "Quick Sort is a highly efficient sorting algorithm that works by partitioning an array around a pivot and recursively sorting the sub-arrays. It typically achieves O(n log n) time complexity, making it very fast in practice. However, if the pivot choice is poor, it can degrade to O(n²). Despite this, Quick Sort is widely used due to its superior average performance and minimal memory usage.",
      tempLabel: "Smaller than pivot",
    },
    merge: {
      title: "Merge Sort",
      shortDescription:
        "Merge Sort is consistent and stable with predictable performance, ideal for large datasets, but requires additional memory.",
      longDescription:
        "Merge Sort is a stable and reliable sorting algorithm that divides the array into smaller sub-arrays, sorts them, and then merges them back together. Its time complexity is O(n log n) in all cases, making it suitable for large datasets. However, its need for additional memory during the merging process can be a limitation in resource-constrained environments.",
      tempLabel: "Merged",
    },
    heap: {
      title: "Heap Sort",
      shortDescription:
        "Builds a max-heap and repeatedly moves the largest value to the end, guaranteeing O(n log n) with no extra memory.",
      longDescription:
        "Heap Sort first rearranges the array into a max-heap, a tree stored in the array where every parent is larger than its children, so the largest value sits at the root. It then swaps the root with the last unsorted item, shrinks the heap by one, and sifts the new root down to restore the heap. This guarantees O(n log n) time in every case and sorts in place, though it isn't stable and tends to be slower than Quick Sort in practice.",
    },
    radix: {
      title: "Radix Sort",
      shortDescription:
        "Sorts numbers digit by digit without ever comparing two values, in time proportional to the number of digits.",
      longDescription:
        "Radix Sort (LSD) never compares values against each other. Instead, it groups the numbers by their last digit, then by the next one, and so on up to the most significant digit. Each pass is stable, so the order from earlier digits is preserved, and after the last pass the array is sorted. Its time is O(d·n), where d is the number of digits, which beats comparison sorts for integers with few digits, at the cost of extra memory for the buckets.",
      tempLabel: "Placed this pass",
    },
  },
  es: {
    selection: {
      title: "Selection Sort",
      shortDescription:
        "Útil con pocos datos porque hace pocos intercambios, pero rinde mal con muchos datos o casi ordenados por su complejidad O(n²).",
      longDescription:
        "Selection Sort es un algoritmo básico: busca una y otra vez el valor más pequeño de la parte sin ordenar y lo lleva a la parte ordenada. Es simple y hace pocos intercambios, algo útil cuando escribir en memoria es caro. Pero su complejidad O(n²) lo vuelve lento con muchos datos, incluso si ya están casi ordenados, así que conviene para colecciones pequeñas.",
    },
    insertion: {
      title: "Insertion Sort",
      shortDescription:
        "Rápido con pocos datos o casi ordenados, con O(n) en el mejor caso, pero lento con muchos datos en orden aleatorio.",
      longDescription:
        "Insertion Sort construye el arreglo ordenado elemento por elemento. Es eficiente con pocos datos o con datos casi ordenados, donde llega a O(n) en el mejor caso. Pero en el caso promedio y en el peor es O(n²), así que no conviene para muchos datos en orden aleatorio. En cada paso toma el siguiente elemento y lo coloca en su lugar dentro de la parte ya ordenada.",
      tempLabel: "Parte ordenada",
    },
    bubble: {
      title: "Bubble Sort",
      shortDescription:
        "Fácil de implementar e ideal para datos casi ordenados, pero muy lento con arreglos grandes desordenados por su complejidad O(n²).",
      longDescription:
        "Bubble Sort recorre la lista una y otra vez, compara elementos vecinos y los intercambia si están al revés. Funciona mejor con arreglos casi ordenados, donde llega a O(n) en el mejor caso. Aunque es simple, es lento con muchos datos: tanto el caso promedio como el peor son O(n²).",
    },
    cocktail: {
      title: "Cocktail Shaker Sort",
      shortDescription:
        "Un Bubble Sort de ida y vuelta que también lleva los valores pequeños a la izquierda: va bien con datos casi ordenados, pero sigue siendo O(n²) en promedio.",
      longDescription:
        "Cocktail Shaker Sort es una variante de Bubble Sort que recorre la lista en los dos sentidos: la pasada de ida lleva el valor más grande al final y la de vuelta lleva el más pequeño al principio. Así corrige el punto débil de Bubble Sort con los valores pequeños atascados cerca del final (las “tortugas”), y se detiene en cuanto una pasada no hace intercambios, lo que da O(n) en el mejor caso. El caso promedio y el peor siguen siendo O(n²), así que sirve sobre todo para arreglos pequeños o casi ordenados.",
    },
    shell: {
      title: "Shell Sort",
      shortDescription:
        "Un Insertion Sort primero entre elementos lejanos y después cada vez más cercanos: mueve valores lejos desde el principio y en la práctica es mucho más rápido.",
      longDescription:
        "Shell Sort generaliza Insertion Sort: primero ordena elementos separados por un salto grande y después reduce el salto hasta llegar a 1, donde se vuelve un Insertion Sort común sobre un arreglo casi ordenado. Mover valores lejos desde el principio ahorra mucho trabajo después. Su rendimiento depende de la secuencia de saltos: con los saltos que se dividen a la mitad, como aquí, tarda alrededor de O(n^1.5) en promedio y O(n²) en el peor caso, sin usar memoria extra.",
      tempLabel: "Mismo grupo de salto",
    },
    quick: {
      title: "Quick Sort",
      shortDescription:
        "Rápido en la mayoría de los casos, con O(n log n) en promedio, aunque un mal pivote puede hacerlo bastante más lento.",
      longDescription:
        "Quick Sort es un algoritmo de ordenamiento muy eficiente: parte el arreglo alrededor de un pivote y ordena cada parte de forma recursiva. Suele tardar O(n log n), así que en la práctica es muy rápido. Pero si el pivote es malo, puede caer a O(n²). Aun así se usa muchísimo, por su gran rendimiento promedio y porque casi no usa memoria extra.",
      tempLabel: "Menor que el pivote",
    },
    merge: {
      title: "Merge Sort",
      shortDescription:
        "Merge Sort es estable y predecible, ideal para muchos datos, pero necesita memoria adicional.",
      longDescription:
        "Merge Sort es un algoritmo estable y confiable: divide el arreglo en partes más pequeñas, las ordena y después las mezcla de nuevo. Tarda O(n log n) en todos los casos, así que sirve para muchos datos. Pero necesita memoria adicional para mezclar, lo que puede ser un problema cuando la memoria es escasa.",
      tempLabel: "Mezclado",
    },
    heap: {
      title: "Heap Sort",
      shortDescription:
        "Construye un montículo máximo y lleva una y otra vez el valor más grande al final: O(n log n) garantizado, sin memoria extra.",
      longDescription:
        "Heap Sort primero reordena el arreglo como un montículo máximo (max-heap): un árbol guardado en el arreglo donde cada padre es mayor que sus hijos, así que el valor más grande queda en la raíz. Después intercambia la raíz con el último elemento sin ordenar, reduce el montículo en uno y hunde la nueva raíz hasta que el montículo vuelve a ser válido. Garantiza O(n log n) en todos los casos y ordena in situ, aunque no es estable y en la práctica suele ser más lento que Quick Sort.",
    },
    radix: {
      title: "Radix Sort",
      shortDescription:
        "Ordena números dígito por dígito sin comparar nunca dos valores, en un tiempo proporcional a la cantidad de dígitos.",
      longDescription:
        "Radix Sort (LSD) nunca compara valores entre sí. En cambio, agrupa los números por su último dígito, después por el anterior, y así hasta el dígito más significativo. Cada pasada es estable, así que se conserva el orden de los dígitos anteriores, y tras la última pasada el arreglo queda ordenado. Tarda O(d·n), donde d es la cantidad de dígitos, lo que supera a los ordenamientos por comparación con enteros de pocos dígitos, a cambio de memoria extra para las cubetas.",
      tempLabel: "Ubicado en esta pasada",
    },
  },
});

export const sortingAlgorithms = Object.fromEntries(
  (Object.keys(data) as Algorithm[]).map((id) => [id, { ...text[id], ...data[id] }])
) as Record<Algorithm, AlgorithmDetails>;
