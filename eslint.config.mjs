import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Preserve compiler-safety checks after the Next 16.3 config update.
  { rules: reactHooks.configs.recommended.rules },
  {
    // I contenuti didattici live sono nel DB (serviti da @/lib/catalog):
    // questi moduli di @/data sono solo il seed storico e NON vanno
    // reimportati a runtime (doppia fonte di verità — rilievo perizie 2026-08).
    files: ["src/app/**", "src/components/**", "src/hooks/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/data/lessons",
                "@/data/lessons-9-12",
                "@/data/quadri-*",
                "@/data/cuori-*",
                "@/data/courses",
                "@/data/smazzate*",
                "@/data/all-smazzate",
                "@/data/glossary",
              ],
              message:
                "Contenuto DB-backed: usa @/lib/catalog (il seed in @/data diverge dal DB).",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
