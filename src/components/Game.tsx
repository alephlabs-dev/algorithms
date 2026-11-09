import { CheckCircledIcon, CrossCircledIcon, ResetIcon, TargetIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useElementSize } from "@/hooks/useElementSize";

const SEEN_KEY = "guess-seen";
// Remembered per browser: until someone has tried it, the toggle says it's new (the tour may be long done).
const seenBefore = () => {
  try {
    return localStorage.getItem(SEEN_KEY) === "true";
  } catch {
    return true;
  }
};
import * as Popover from "@radix-ui/react-popover";
import { useShallow } from "zustand/react/shallow";
import { localized } from "@/i18n";
import { useModuleUI } from "@/modules";
import { engines } from "@/modules/engine";
import { FEEDBACK_MS, isCellQuestion, type Question } from "@/game";
import { selectGameQuestion, useStore, type StoreState } from "@/store";
import { cn } from "@/utils/cn";
import { Button } from "./ui/button";
import { popoverClass } from "./ui/popover";

const text = localized({
  en: {
    unavailable: (why: string) => `Guess mode unavailable: ${why}`,
    on: (right: number, asked: number) => `Guess mode on, ${right} right out of ${asked}: turn it off`,
    off: "Guess mode: it stops to ask what comes next",
    newLabel: (label: string) => `New: ${label}`,
    toggle: "Guess",
    new: "New",
    dialog: "Your guess",
    status: "How it went",
    streak: (n: number) => ` ${n} in a row.`,
    reset: (right: number, asked: number) => `Score ${right} out of ${asked}: start over`,
    resetTitle: "Start the score over",
    spots: "Spots",
    yes: "Yes",
    no: "No",
    /** The keys that answer yes and no, lowercase. */
    yesKey: "y",
    noKey: "n",
    idle: "Guess is on: playback stops before key moments to ask what comes next.",
  },
  es: {
    unavailable: (why) => `Modo adivinanza no disponible: ${why}`,
    on: (right, asked) =>
      `Modo adivinanza activado, ${right} ${right === 1 ? "acierto" : "aciertos"} de ${asked}: desactívalo`,
    off: "Modo adivinanza: se detiene para preguntar qué sigue",
    newLabel: (label) => `Nuevo: ${label}`,
    toggle: "Adivina",
    new: "Nuevo",
    dialog: "Tu respuesta",
    status: "Cómo te fue",
    streak: (n) => ` ${n} seguidas.`,
    reset: (right, asked) => `Puntaje: ${right} de ${asked}. Empezar de nuevo`,
    resetTitle: "Reiniciar el puntaje",
    spots: "Lugares",
    yes: "Sí",
    no: "No",
    yesKey: "s",
    noKey: "n",
    idle: "Modo adivinanza: se detiene antes de cada momento clave para preguntarte qué sigue.",
  },
});

/** Whether the module on stage has a guess mode, in the view on stage. */
const useHasGame = () => useStore((s) => s.view === "single" && engines[s.module].game !== undefined);

/** Why guess mode can't play the run on stage (too many items, say), or null when it can. */
const useGameUnavailable = () => useStore((s) => engines[s.module].gameUnavailable?.(s) ?? null);

/**
 * Turns guess mode on and off, and while it's on, keeps the score: "Guess 3/5"
 * where there's room, the target and "3/5" on phones.
 */
export const GameToggle = ({ compact }: { compact?: boolean }) => {
  const { isOn, toggle, score } = useStore(
    useShallow((s) => ({ isOn: s.isGameOn, toggle: s.toggleGame, score: s.gameScore })),
  );
  const unavailable = useGameUnavailable();
  const { gameFix } = useModuleUI();
  // Only the label: the fix itself is worked out on the tap, from the store as it is then.
  const fixLabel = useStore((s) => gameFix?.(s)?.label ?? null);
  const [seen, setSeen] = useState(seenBefore);
  if (!useHasGame()) return null;
  // Guess is on and can play this run; when it can't, the toggle looks off.
  const playing = isOn && unavailable === null;
  // "New" only where Guess can be tried: a toggle that only says why it's off would never clear it.
  const isNew = !seen && unavailable === null;
  const tally = `${score.right}/${score.asked}`;
  const markSeen = () => {
    if (seen) return;
    setSeen(true);
    try {
      localStorage.setItem(SEEN_KEY, "true");
    } catch {
      // Private mode: it just says "new" again next time.
    }
  };
  const onClick = () => {
    if (unavailable) return;
    toggle();
    markSeen();
  };
  const label = unavailable
    ? text.unavailable(unavailable)
    : playing
      ? text.on(score.right, score.asked)
      : text.off;
  const button = (
    <Button
      variant={playing ? "primary" : "ghost"}
      size={compact && !playing ? "icon" : "sm"}
      onClick={onClick}
      aria-pressed={playing}
      aria-label={isNew ? text.newLabel(label) : label}
      title={label}
      data-tour="game"
      className={cn(
        "relative h-10 shrink-0",
        (!compact || playing) && "gap-1.5 px-3.5",
        compact && playing && "px-3",
        !playing && !compact && "border border-line/70",
        unavailable && "cursor-not-allowed opacity-50 hover:bg-transparent",
      )}
    >
      <TargetIcon />
      {!compact && text.toggle}
      {playing && <span className="font-mono text-xs">{tally}</span>}
      {isNew &&
        (compact ? (
          <span
            aria-hidden
            className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-secondary ring-2 ring-background"
          />
        ) : (
          <span
            aria-hidden
            className="absolute -right-2 -top-2 rounded-full bg-secondary px-1.5 py-px text-[10px] font-bold uppercase leading-4 text-background"
          >
            {text.new}
          </span>
        ))}
    </Button>
  );
  if (!unavailable) return button;
  // Not disabled: touch screens never show the title, so the toggle opens a note saying why it's off.
  return (
    <Popover.Root>
      <Popover.Trigger asChild>{button}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={8} className={cn(popoverClass, "flex w-64 flex-col gap-3 text-sm")}>
          <p>{unavailable}.</p>
          {fixLabel && (
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={() => {
                gameFix?.(useStore.getState())?.apply();
                markSeen();
              }}
            >
              {fixLabel}
            </Button>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

/** Guess mode's panel under the stage: at least this tall, with this much space above it (CSS pixels). */
const GAME_PANEL_MIN_HEIGHT = 112;
const GAME_PANEL_GAP = 8;
/**
 * Room the panel takes from the stage while guess mode is on, on screens wider than a phone:
 * what a stage sizing itself for it subtracts. Phones take none (the question takes the dock's place).
 */
export const GAME_ROOM = GAME_PANEL_MIN_HEIGHT + GAME_PANEL_GAP;

const optionClass =
  "tap-target relative h-10 min-w-12 rounded-full border border-line/70 px-4 font-mono text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary";

type Feedback = NonNullable<StoreState["gameFeedback"]>;

/** Guess mode is on, in single view, and can play the run on stage. */
const useGuessOn = () => {
  const on = useStore((s) => s.isGameOn && s.view === "single");
  const unavailable = useGameUnavailable();
  return on && unavailable === null;
};

/** The card guess mode asks and answers in. */
const Card = ({
  question,
  right,
  className,
  style,
  children,
}: {
  question: boolean;
  right?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) => (
  <div
    role={question ? "dialog" : undefined}
    aria-label={question ? text.dialog : undefined}
    style={style}
    className={cn(
      "flex min-h-14 w-full flex-col justify-center gap-2 rounded-2xl border bg-surface px-4 py-2.5 shadow-lg",
      right ? "border-primary" : "border-edge",
      className,
    )}
  >
    {children}
  </div>
);

/** How the last answer went, with the score's reset beside it. */
const FeedbackLine = ({ feedback }: { feedback: Feedback }) => {
  const { score, reset } = useStore(useShallow((s) => ({ score: s.gameScore, reset: s.resetGame })));
  return (
    <p role="status" aria-label={text.status} className="flex items-start gap-2 text-sm text-foreground">
      {feedback.right ? (
        <CheckCircledIcon className="mt-0.5 shrink-0 text-primary" />
      ) : (
        <CrossCircledIcon className="mt-0.5 shrink-0 text-tertiary" />
      )}
      <span className="flex-1">
        {feedback.text}
        {feedback.right && score.streak > 1 && (
          <span className="font-semibold text-primary">{text.streak(score.streak)}</span>
        )}
      </span>
      <button
        type="button"
        onClick={reset}
        className="tap-target relative shrink-0 rounded-full p-1 text-foreground/60 hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={text.reset(score.right, score.asked)}
        title={text.resetTitle}
      >
        <ResetIcon />
      </button>
    </p>
  );
};

/** A question's prompt and the ways to answer it. */
const QuestionBody = ({ question }: { question: Question }) => {
  const answer = useStore((s) => s.answerGame);
  return (
    <>
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <TargetIcon className="shrink-0 text-secondary" />
        {question.prompt}
      </p>
      {question.kind === "choice" && (
        <div className="flex flex-wrap gap-2">
          {question.options.map((option, k) => {
            const label = question.optionLabels?.[k] ?? String(option);
            return (
              <button
                key={option}
                type="button"
                // Numbers stay monospaced so they line up; words ("Dead end", "4 stays") read in the body font.
                className={cn(optionClass, !/^\d+$/.test(label) && "font-sans")}
                onClick={() => answer(option)}
                aria-keyshortcuts={/^[A-Z]$/.test(label) ? `${k + 1} ${label}` : String(k + 1)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      {question.kind === "slot" && (
        // The spots as buttons too: for keyboards, screen readers and fingers on small trees.
        <div
          role="group"
          aria-label={text.spots}
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] pointer-coarse:-my-1.5 pointer-coarse:py-1.5"
        >
          {question.slots.map((slot) => (
            <button
              key={slot.key}
              type="button"
              className="tap-target relative h-8 shrink-0 whitespace-nowrap rounded-full border border-line/70 px-3 text-xs text-foreground/85 transition-colors hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => answer(slot.key)}
            >
              {slot.label}
            </button>
          ))}
        </div>
      )}
      {question.kind === "yesno" && (
        <div className="flex gap-2">
          <button type="button" className={optionClass} onClick={() => answer(true)} aria-keyshortcuts={text.yesKey.toUpperCase()}>
            {text.yes}
          </button>
          <button type="button" className={optionClass} onClick={() => answer(false)} aria-keyshortcuts={text.noKey.toUpperCase()}>
            {text.no}
          </button>
        </div>
      )}
    </>
  );
};

/** Keys: 1–4 pick an option, Y and N (S and N in Spanish) answer yes-or-no, letters pick lettered cells. */
const useAnswerKeys = (question: Question | null) => {
  const answer = useStore((s) => s.answerGame);
  useEffect(() => {
    if (!question || question.kind === "slot") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.metaKey || event.ctrlKey) return;
      if (question.kind === "yesno") {
        if (event.key === text.yesKey) answer(true);
        if (event.key === text.noKey) answer(false);
        return;
      }
      const k = Number(event.key);
      if (k >= 1 && k <= question.options.length) answer(question.options[k - 1]);
      // Lettered options (pathfinding's A–D cells) answer to their letter too.
      const lettered = question.optionLabels?.findIndex((l) => /^[A-Z]$/.test(l) && l === event.key.toUpperCase()) ?? -1;
      if (lettered >= 0) answer(question.options[lettered]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, answer]);
};

/**
 * The last answer's explanation while it's up: a few seconds, then it gets out of the way.
 * Not over a question that letters grid cells (stepped to by hand; playback waits for it
 * to go): the explanation's letters would point at the new cells.
 */
const useShownFeedback = (question: Question | null): Feedback | null => {
  const feedback = useStore((s) => s.gameFeedback);
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    if (!feedback) return;
    const show = window.setTimeout(() => setShown(feedback.id), 0);
    const hide = window.setTimeout(() => setShown(null), FEEDBACK_MS);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [feedback]);
  return feedback !== null && shown === feedback.id && !isCellQuestion(question) ? feedback : null;
};

/**
 * Guess mode on the stage. Wider than a phone: under the stage, the question waiting for an
 * answer or how the last one went, in room the stage gives up once while guess mode is on.
 * Phones have no room to give: the question takes the dock's place (GameDock), and the
 * explanation floats just above the stage for a few seconds.
 */
export const GameLayer = () => {
  const { question, phone } = useStore(useShallow((s) => ({ question: selectGameQuestion(s), phone: s.isMobile })));
  const on = useGuessOn();
  const feedback = useShownFeedback(question);
  useAnswerKeys(on ? question : null);
  if (!on) return null;

  if (phone)
    return (
      // Just above the stage, over the step sentence and the pickers for those few seconds:
      // the stage stays in full view, with whatever the explanation talks about.
      <div className="pointer-events-none absolute inset-x-0 bottom-full z-10 mb-2 flex items-end justify-center">
        {feedback && (
          <Card question={false} right={feedback.right} className="pointer-events-auto">
            <FeedbackLine feedback={feedback} />
          </Card>
        )}
      </div>
    );

  return (
    // Its size comes from GAME_PANEL_MIN_HEIGHT and GAME_PANEL_GAP, so GAME_ROOM always matches it.
    <div
      className="flex shrink-0 flex-col justify-end"
      style={{ minHeight: GAME_PANEL_MIN_HEIGHT, marginTop: GAME_PANEL_GAP }}
    >
      {question || feedback ? (
        <Card question={question !== null} right={!question && feedback?.right}>
          {feedback && <FeedbackLine feedback={feedback} />}
          {question && <QuestionBody question={question} />}
        </Card>
      ) : (
        <p className="flex items-center gap-2 px-1 pb-2 text-sm text-foreground/60">
          <TargetIcon className="shrink-0" />
          {text.idle}
        </p>
      )}
    </div>
  );
};

/**
 * The playback dock, and on phones the question waiting for an answer in its place: at least
 * as tall as the dock was, so the stage keeps its size. Playback can't go on until it's
 * answered; then the dock is back. The dock stays mounted throughout: it drives playback.
 */
export const GameDock = ({ hidden, children }: { hidden?: boolean; children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { height } = useElementSize(ref);
  // The dock's height while it was last on screen (0 while hidden).
  const [dockHeight, setDockHeight] = useState(0);
  if (height > 0 && height !== dockHeight) setDockHeight(height);
  const waiting = useStore((s) => (s.isMobile ? selectGameQuestion(s) : null));
  const question = useGuessOn() ? waiting : null;
  return (
    <>
      <div ref={ref} className={cn("w-full", (hidden || question) && "hidden")}>
        {children}
      </div>
      {question && !hidden && (
        <Card question className="mx-auto max-w-5xl rounded-3xl p-4" style={{ minHeight: dockHeight || undefined }}>
          <QuestionBody question={question} />
        </Card>
      )}
    </>
  );
};
