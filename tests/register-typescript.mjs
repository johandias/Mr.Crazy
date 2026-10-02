import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    const parentUrl = context.parentURL ?? "";
    if (
      !parentUrl.includes("/node_modules/") &&
      !parentUrl.includes("\\node_modules\\") &&
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      !/\.[a-z]+$/i.test(specifier)
    ) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  }
});
