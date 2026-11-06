import { test, expect, type Locator, type Page } from '@playwright/test';

// Runs on every device project. The algorithm picker on phones and tablets (UX.md rule 11, #97):
// modules whose algorithms fit as one row of segments at 393px show them inline; the rest keep
// ui/NativeSelect, a styled trigger over a native <select> so phones open their own picker.

type Picker = 'segments' | 'select';
const modules: { route: string; tourKey: string; picker: Picker; tour: string | null }[] = [
  { route: '/sorting/insertion-sort', tourKey: 'tour-done', picker: 'select', tour: 'Pick an algorithm' },
  { route: '/graphs', tourKey: 'tour-done-graphs', picker: 'select', tour: 'Pick an algorithm' },
  { route: '/pathfinding', tourKey: 'tour-done-pathfinding', picker: 'segments', tour: 'Pick a search' },
  { route: '/structures', tourKey: 'tour-done-structures', picker: 'select', tour: 'Pick a structure' },
  { route: '/fourier', tourKey: 'tour-done-fourier', picker: 'segments', tour: 'Pick a series' },
  { route: '/dynamic-programming', tourKey: 'tour-done-dp', picker: 'select', tour: 'Pick a problem' },
  { route: '/backtracking', tourKey: 'tour-done-backtracking', picker: 'segments', tour: null },
];
const languages = [
  { prefix: '', name: 'Algorithm', lang: 'en' },
  { prefix: '/es', name: 'Algoritmo', lang: 'es' },
] as const;

/** The phone and tablet bar is on screen (below lg). */
const phoneBar = (page: Page) => page.evaluate(() => !matchMedia('(min-width: 1024px)').matches);

/** Each segment's label lies inside its segment's padding box, on one line. */
const overflowing = (group: Locator) =>
  group.getByRole('radio').evaluateAll((radios) =>
    radios
      .map((radio) => {
        const label = radio.querySelector<HTMLElement>('[data-segment-label]');
        if (!label) return `${radio.textContent}: no label`;
        const box = radio.getBoundingClientRect();
        const style = getComputedStyle(radio);
        const left = box.left + parseFloat(style.paddingLeft) - 0.5;
        const right = box.right - parseFloat(style.paddingRight) + 0.5;
        const text = label.getBoundingClientRect();
        const lines = label.getClientRects().length;
        return text.left < left || text.right > right || lines !== 1
          ? `${label.textContent}: ${Math.round(text.width)}px in ${Math.round(right - left)}px, ${lines} lines`
          : null;
      })
      .filter(Boolean),
  );

for (const m of modules) {
  for (const l of languages) {
    test(`${l.prefix}${m.route} picks the algorithm with ${m.picker}`, async ({ page }) => {
      await page.addInitScript((key) => localStorage.setItem(key, 'true'), m.tourKey);
      await page.goto(`${l.prefix}${m.route}`);
      await expect(page.locator('html')).toHaveAttribute('lang', l.lang);
      test.skip(!(await phoneBar(page)), 'the phone and tablet bar only');

      const segments = page.getByRole('radiogroup', { name: l.name, exact: true });
      const select = page.getByRole('combobox', { name: l.name, exact: true });
      if (m.picker === 'segments') {
        await expect(segments).toBeVisible();
        await expect(select).toHaveCount(0);
        expect(await overflowing(segments), 'labels that do not fit on one line').toEqual([]);

        // Picking a segment puts that algorithm on stage.
        const second = segments.getByRole('radio').nth(1);
        await second.click();
        await expect(second).toHaveAttribute('aria-checked', 'true');
        await expect(segments.getByRole('radio', { checked: true })).toHaveCount(1);
      } else {
        await expect(select).toBeVisible();
        await expect(segments).toHaveCount(0);
        await expect(select).toHaveCSS('appearance', 'none');
        // Picking another option puts that algorithm on stage.
        const current = await select.inputValue();
        const values = await select.locator('option').evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
        const other = values.find((v) => v !== current)!;
        await select.selectOption(other);
        await expect(select).toHaveValue(other);
      }
    });
  }

  const tour = m.tour;
  if (!tour) continue;
  test(`the tour's first step on ${m.route} lights the picker on screen`, async ({ page }) => {
    await page.goto(m.route);
    await expect(page.getByRole('dialog', { name: tour })).toBeVisible();
    const picker = page.locator('[data-tour="picker"]:visible');
    const light = page.locator('[role="dialog"][aria-modal="true"]').locator('xpath=preceding-sibling::div[1]');
    await expect
      .poll(async () => {
        const p = await picker.boundingBox();
        const l = await light.boundingBox();
        if (!p || !l) return false;
        return l.x <= p.x && l.y <= p.y && l.x + l.width >= p.x + p.width && l.y + l.height >= p.y + p.height;
      })
      .toBe(true);
  });
}
