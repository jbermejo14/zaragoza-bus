// Registra el cargador de TypeScript para `node --test` (ver ts-loader.mjs).
import { register } from 'node:module';

register('./ts-loader.mjs', import.meta.url);
