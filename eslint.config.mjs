import eslintConfigNext from "eslint-config-next/core-web-vitals";

/** Next.js 16 / react-hooks 7 adds strict rules that flag common mounted/layout patterns; keep off until refactored. */
const eslintConfig = [
  ...eslintConfigNext,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
