import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { ViteDevServer, PreviewServer, Connect } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    fs: {
      // Allow serving files from the public directory
      allow: ['..']
    }
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    {
      name: 'configure-response-headers',
      configureServer: (server: ViteDevServer) => {
        server.middlewares.use((req: Connect.IncomingMessage, res: any, next: Connect.NextFunction) => {
          // Set CORS headers for all requests
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          
          // Set proper MIME type for WASM files
          if (req.url?.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
          }
          
          // Set proper headers for JavaScript files that might use SharedArrayBuffer
          if (req.url?.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
          }
          
          next();
        });
      },
      configurePreviewServer: (server: PreviewServer) => {
        server.middlewares.use((req: Connect.IncomingMessage, res: any, next: Connect.NextFunction) => {
          // Also set headers for preview/production
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          
          if (req.url?.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
          }
          
          if (req.url?.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
          }
          
          next();
        });
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Ensure public files are copied to dist
    copyPublicDir: true,
  }
}));
