import { lang, LANGS } from "@/i18n";
import { isTranslated, pathIn, SITE_URL, TRANSLATED_MODULES, type ModuleName, type Route } from "@/routes";
import { pageMeta, structuredData } from "./pages";

const absolute = (path: string) => SITE_URL + (path === "/" ? "/" : path);

/**
 * The page in every language, for hreflang. Only pages with a Spanish
 * version list one; English is also the default for other languages.
 */
const alternates = (route: Route, translated = TRANSLATED_MODULES): { hreflang: string; href: string }[] =>
  isTranslated(route, translated)
    ? [
        ...LANGS.map((language) => ({ hreflang: language, href: absolute(pathIn(route, language)) })),
        { hreflang: "x-default", href: absolute(pathIn(route, "en")) },
      ]
    : [];

/** A Spanish page whose module isn't translated yet is English text: keep it out of search. */
const noindex = (route: Route, translated = TRANSLATED_MODULES) => lang !== "en" && !isTranslated(route, translated);

const escapeAttr = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// JSON inside <script> must not be able to close the tag.
const jsonForScript = (data: object[]) => JSON.stringify(data.length === 1 ? data[0] : data).replace(/</g, "\\u003c");

/** Meta tags whose content depends on the page, keyed by how index.html names them. */
const metaContent = (route: Route): [selector: string, content: string][] => {
  const meta = pageMeta(route);
  return [
    ['name="description"', meta.description],
    ['property="og:title"', meta.title],
    ['property="og:description"', meta.description],
    ['property="og:url"', meta.url],
    ['name="twitter:title"', meta.title],
    ['name="twitter:description"', meta.description],
  ];
};

/**
 * Build time: rewrites the head of index.html for a page. index.html holds
 * the home page's tags; every one listed here must exist there.
 */
export const renderHead = (html: string, route: Route, translated: ReadonlySet<ModuleName> = TRANSLATED_MODULES): string => {
  const meta = pageMeta(route);
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(meta.title)}</title>`);
  for (const [selector, content] of metaContent(route)) {
    const pattern = new RegExp(`(<meta ${selector}\\s+content=")[^"]*(")`);
    if (!pattern.test(out)) throw new Error(`index.html is missing <meta ${selector}>`);
    out = out.replace(pattern, `$1${escapeAttr(content)}$2`);
  }
  out = out.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${meta.url}$2`);
  out = out.replace(
    /(<script type="application\/ld\+json" id="structured-data">)[\s\S]*?(<\/script>)/,
    `$1${jsonForScript(structuredData(route))}$2`
  );
  out = out.replace(/<html lang="[^"]*">/, `<html lang="${lang}">`);
  const extra = [
    ...alternates(route, translated).map((link) => `<link rel="alternate" hreflang="${link.hreflang}" href="${link.href}" />`),
    ...(noindex(route, translated) ? ['<meta name="robots" content="noindex" />'] : []),
  ];
  if (extra.length) out = out.replace("</head>", `    ${extra.join("\n    ")}\n  </head>`);
  return out;
};

/** In the browser: keeps the head in step when moving between pages without a reload. */
export const applyHead = (route: Route) => {
  const meta = pageMeta(route);
  document.title = meta.title;
  for (const [selector, content] of metaContent(route)) {
    document.head.querySelector(`meta[${selector}]`)?.setAttribute("content", content);
  }
  document.head.querySelector('link[rel="canonical"]')?.setAttribute("href", meta.url);
  const script = document.getElementById("structured-data");
  if (script) script.textContent = jsonForScript(structuredData(route));

  // Moving between modules can change whether the page has a Spanish version.
  for (const link of document.head.querySelectorAll('link[rel="alternate"][hreflang]')) link.remove();
  for (const { hreflang, href } of alternates(route)) {
    const link = document.createElement("link");
    Object.assign(link, { rel: "alternate", hreflang, href });
    document.head.append(link);
  }
  document.head.querySelector('meta[name="robots"]')?.remove();
  if (noindex(route)) {
    const meta = document.createElement("meta");
    Object.assign(meta, { name: "robots", content: "noindex" });
    document.head.append(meta);
  }
};
