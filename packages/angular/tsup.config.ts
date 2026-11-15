import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/public-api.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  treeshake: true,
  splitting: false,
  external: [
    '@angular/core',
    '@angular/common',
    '@angular/forms',
    'rxjs',
    '@madelixa/color-core',
    '@madelixa/color-dom'
  ]
});
