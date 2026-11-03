# Sorting Algorithms Visualizer

This project is a visualizer for various sorting algorithms. It provides an interactive way to learn and understand how different sorting algorithms work by displaying them in action. The application is built using modern web development tools, including React, TypeScript, and Zustand for state management.

## Demo

Check out the live demo of the application [here](https://sorting-algorithms-app-v2.vercel.app/).

### Desktop View

https://github.com/user-attachments/assets/86bbed79-9078-4e2d-bb3e-5e4f7c083fe8

### Mobile View

https://github.com/user-attachments/assets/c3705203-1f45-4e31-867c-3eb92f1a8f0e

## Features

- **Nine algorithms**: Selection, Insertion, Bubble, Cocktail Shaker, Shell, Quick, Merge, Heap and Radix Sort.
- **Race mode**: Run 2–4 algorithms side by side on the same array and the same clock, where each tick is one operation (a comparison, a swap or a write).
- **Pseudocode**: The current line is highlighted as the algorithm runs; on phones it shows as a one-line caption that opens the full code.
- **Playback Controls**: Play, pause, step forward and back, or drag the progress bar to any point of the run.
- **Live Counters**: Comparisons and swaps (or writes, for algorithms that move values instead of swapping them).
- **Large arrays**: From 10 up to 400 items, drawn on canvas at 60+ fps, with an exponential speed control from 1 to ~2000 steps per second.
- **Input Presets**: Random, nearly sorted, reversed, sorted or few unique values, to see best and worst cases.
- **Shareable links**: The URL holds every setting plus a seed, so a link reproduces the exact same array.
- **Color Legend**: Explains what each highlight color means for the selected algorithm.
- **Keyboard Shortcuts**: `Space` to play/pause, `←`/`→` to step, `R` for a new array.
- **Accessible**: Keyboard focus rings, a text description of each step for screen readers, and `prefers-reduced-motion` support.
- **Responsive Design**: Works on desktop, tablet and phone.

## Built With

- **Vite** and **React 19** with **TypeScript**.
- **Zustand** for state management.
- **Canvas 2D** for the visualization, with a small custom animation engine.
- **Tailwind CSS 4**, **Radix UI** and **vaul** for the interface.
- **Vitest** for tests.
- **PNPM** for package management.

## Installation

1. Clone the repository:

```bash
git clone https://github.com/ignaciomartinelias/sorting-algorithms-app-v2.git
cd sorting-algorithms-app-v2
```

2. Install dependencies using PNPM:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

4. Open your browser and navigate to http://localhost:5173/ to view the application.

5. Run the tests:

```bash
pnpm test
```

## How It Works

Each algorithm in `src/algorithms` is a generator that yields the steps it takes (`compare`, `swap`, `move`, `done`, plus the pseudocode line) without touching React or timers. A `Timeline` runs it once and records the steps, with a full snapshot every 512 steps, so any frame can be rebuilt quickly and playing forward costs one step. The UI just picks a frame: pausing, stepping, seeking and racing are all index changes.

`src/canvas` draws frames on a canvas and animates between them: moves follow an ease-in-out curve with the swap arc tied to the same progress, and highlights ease with a critically damped spring. The animation loop only runs while something moves.

## Usage

- **Select an Algorithm**: Choose from the available sorting algorithms in the sidebar.
- **Adjust Settings**: Use the controls to adjust speed, array size, and display mode.
- **Start Visualization**: Click "Play" to run the selected algorithm, "Pause" to stop it, and the arrows to move one step at a time.
- **Compare Algorithms**: Switching algorithms keeps the same array, so you can compare them on identical data. "Reset" generates a new one.

## Pending Features

- **Onboarding Process**: Introduce an onboarding process to guide first-time users through the application.

## Contributing

Contributions are welcome! If you have any ideas, suggestions, or bug reports, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
