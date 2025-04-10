import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  plugins: [vue()],
});
