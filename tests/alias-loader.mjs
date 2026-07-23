import { pathToFileURL } from "node:url";
import path from "node:path";
import { existsSync } from "node:fs";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const relative = specifier.slice(2);
    const resolved = path.resolve(process.cwd(), "src", relative);
    const target = path.extname(resolved)
      ? resolved
      : existsSync(`${resolved}.ts`)
        ? `${resolved}.ts`
        : `${resolved}.tsx`;
    return {
      shortCircuit: true,
      url: pathToFileURL(target).href,
    };
  }

  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !path.extname(specifier) &&
    context.parentURL?.startsWith("file:")
  ) {
    const tsCandidate = new URL(`${specifier}.ts`, context.parentURL);
    const tsxCandidate = new URL(`${specifier}.tsx`, context.parentURL);
    if (existsSync(tsCandidate)) {
      return { shortCircuit: true, url: tsCandidate.href };
    }
    if (existsSync(tsxCandidate)) {
      return { shortCircuit: true, url: tsxCandidate.href };
    }
  }

  return nextResolve(specifier, context);
}
