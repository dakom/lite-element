import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import copy from 'rollup-plugin-copy';
import pkg from './package.json';

const filesizeConfig = {
  showGzippedSize: true,
  showBrotliSize: false,
  showMinifiedSize: false,
};

// The main JavaScript bundle for modern browsers that support
// JavaScript modules and other ES2015+ features.
const config = {
  input: './.ts-output/lib.js',
  output: {
    dir: 'dist',
    format: 'es',
  },

  output: [
    { file: pkg.module, format: 'es', sourcemap: true },
    { file: pkg.main, format: 'cjs', sourcemap: true }
  ],
  
  external: ['lit-html'],
  
  plugins: [
    minifyHTML(),
    resolve(),
    filesize(filesizeConfig),
	  terser({
      output: {
        comments: false
      }
    }),
	copy({
      targets: [
        { src: './.ts-output/**/*.d.ts', dest: './dist/' },
		{ src: './.ts-output/**/*.d.ts.map', dest: './dist/' }
      ]
    })
  ],
};


export default config;