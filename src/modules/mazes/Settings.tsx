import { localized } from "@/i18n";
import { Field } from "@/components/Settings/Field";
import { MazeSizePicker } from "./MazeTools";

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

/** Mazes' settings: the size is the only one. */
export const MazeSettings = () => (
  <Field label={text.mazeSize} help={text.mazeSizeHelp} tour="tools">
    <MazeSizePicker />
  </Field>
);
