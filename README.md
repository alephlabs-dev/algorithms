# Sorting Algorithms Visualizer

This project is a visualizer for various sorting algorithms. It provides an interactive way to learn and understand how different sorting algorithms work by displaying them in action. The application is built using modern web development tools, including React, TypeScript, and Zustand for state management.

## Demo

Check out the live demo of the application [here](https://sorting-algorithms-app-v2.vercel.app/).

### Desktop View

https://github.com/user-attachments/assets/86bbed79-9078-4e2d-bb3e-5e4f7c083fe8

### Mobile View

https://github.com/user-attachments/assets/c3705203-1f45-4e31-867c-3eb92f1a8f0e

## Features

- **Responsive Design**: The visualizer is fully responsive, offering a seamless experience on both desktop and mobile devices.
- **Algorithm Visualizations**: Currently supports the following sorting algorithms:
  - Selection Sort
  - Insertion Sort
  - Bubble Sort
  - Quick Sort
  - Merge Sort
- **Playback Controls**: Play, pause, step forward and back, or drag the progress bar to any point of the run.
- **Live Counters**: See how many comparisons and swaps (or writes, for Merge Sort) each algorithm needs.
- **Customizable Settings**: Users can adjust the speed of the visualization, the size of the array, and the display mode (bars or numbers).

## Built With

- **Vite**: For fast and optimized development and build tooling.
- **React**: For building the user interface.
- **TypeScript**: Ensuring type safety and reducing runtime errors.
- **Zustand**: For simple and scalable state management.
- **Framer Motion**: For smooth and customizable animations.
- **PNPM**: For fast, disk space efficient package management.

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

Each algorithm in `src/algorithms` is a generator that yields the steps it takes (`compare`, `swap`, `overwrite`, `done`) without touching React or timers. `recordFrames` runs it once and turns those steps into a list of frames, and the UI just plays that list back. That keeps the algorithms small and testable, and makes pausing, stepping and seeking trivial.

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
