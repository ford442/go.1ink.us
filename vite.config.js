import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'add-css-charset',
      transformIndexHtml(html) {
        // 1. Find the CSS link that Vite injected
        // 2. Add charset="utf-8" to it
        return html.replace(
          /<link rel="stylesheet"/g,
          '<link rel="stylesheet" charset="utf-8"'
        );
      }
    }
  ]
})
