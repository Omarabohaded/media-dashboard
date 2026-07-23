import { pathToFileURL } from "node:url";
import path from "node:path";
import { existsSync } from "node:fs";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const relative = specifier.slice(2);
    const resolved = path.resolve(process.cwd(), "src", relative);
    return {
      shortCircuit: true,
      url: pathToFileURL(path.extname(resolved) ? resolved : `${resolved}.ts`).href,
    };
  }

  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !path.extname(specifier) &&
    context.parentURL?.startsWith("file:")
  ) {
    const candidate = new URL(`${specifier}.ts`, context.parentURL);
    if (existsSync(candidate)) {
      return { shortCircuit: true, url: candidate.href };
    }
  }

  return nextResolve(specifier, context);
}
