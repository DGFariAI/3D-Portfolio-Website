import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  optimizeDeps: {
    // three-stdlib is no longer a direct dependency, but @react-three/drei
    // still pulls it in and it does not survive Vite's pre-bundling.
    exclude: ['three-stdlib']
  },
  assetsInclude: ['**/*.wasm']
});
