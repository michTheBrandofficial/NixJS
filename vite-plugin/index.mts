import type { ESBuildOptions } from 'vite';

const esbuildOptions: ESBuildOptions = {
  jsxFactory: 'Nixix.create',
  jsxFragment: '"fragment"',
  jsxImportSource: 'nixix',
  jsxDev: false,
  jsx: 'transform',
  jsxInject: "import Nixix from 'nixix/dom';",
  minifyIdentifiers: true,
};

const devEsbuildOptions = {
  jsxFactory: 'Nixix.create',
  jsxFragment: "'fragment'",
  jsxImportSource: './index.js',
  jsxInject: 'import Nixix from "dom"',
};

export { devEsbuildOptions, esbuildOptions };
