import { localized } from "@/i18n";
import { Field } from "@/components/Settings/Field";
import { useStore } from "@/store";
import { MazeSizePicker } from "./MazeTools";
import { SolveLink } from "./SolveLink";

const text = localized({
  en: {
    mazeSize: "Maze size",
    mazeSizeHelp: "Bigger mazes take longer to carve and show their texture better. New maze keeps the size.",
  },
  es: {
    mazeSize: "Tamaño del laberinto",
    mazeSizeHelp: "Los laberintos grandes tardan más en excavarse y muestran mejor su textura. Laberinto nuevo mantiene el tamaño.",
  },
});

/** Mazes' settings: the size, and in single view a way to solve the maze in pathfinding. */
export const MazeSettings = () => {
  const single = useStore((s) => s.view !== "race");
  return (
    <>
      <Field label={text.mazeSize} help={text.mazeSizeHelp} tour="tools">
        <MazeSizePicker />
      </Field>
      {single && <SolveLink />}
    </>
  );
};
