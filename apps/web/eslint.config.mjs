import coreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...[coreWebVitals, nextTypescript].flat(),
  {
    ignores: ['.next/**', 'node_modules/**', 'public/sw.js'],
  },
];

export default eslintConfig;
