// Bundle a data layer with esbuild (called by ../build_firebase.py; works the same on Windows, macOS and Linux).
//   node scripts/bundle.mjs <entry> <outfile>
import { build } from 'esbuild';

const [entry, outfile] = process.argv.slice(2);
await build({ entryPoints: [entry], outfile, bundle: true, minify: true, format: 'iife', target: 'es2020', logLevel: 'warning' });
