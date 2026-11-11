import { useStore } from "@/store";
import { localized } from "@/i18n";
import { Field } from "@/components/Settings/Field";
import { CirclesPicker, DrawingSelect } from "./FourierTools";

const text = localized({
  en: {
    circles: "Circles",
    circlesHelp: "More circles, closer to the goal. Jumps and corners need the most.",
    drawing: "Drawing",
    drawingHelp: "“Draw your own” turns the stage into a canvas: draw a shape in one stroke.",
  },
  es: {
    circles: "Círculos",
    circlesHelp: "Más círculos, más cerca del objetivo. Los saltos y las esquinas necesitan más.",
    drawing: "Dibujo",
    drawingHelp: "“Dibuja el tuyo” convierte el escenario en un lienzo: dibuja una figura de un solo trazo.",
  },
});

/** Fourier's settings: how many circles, and for epicycles which drawing. */
export const FourierSettings = () => {
  const wave = useStore((s) => s.fourier.algorithm !== "epicycles");
  return (
    <div data-tour="tools" className="flex flex-col gap-6">
      <Field label={text.circles} help={text.circlesHelp}>
        <CirclesPicker />
      </Field>
      {!wave && (
        <Field label={text.drawing} help={text.drawingHelp}>
          <DrawingSelect />
        </Field>
      )}
    </div>
  );
};
