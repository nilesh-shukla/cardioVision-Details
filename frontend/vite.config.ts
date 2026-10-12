import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (command === 'build' && !env.VITE_API_BASE_URL?.trim()) {
    throw new Error(
      'VITE_API_BASE_URL must be set when building the frontend for production.',
    )
  }

  return {
    plugins: [react(), tailwindcss()],
  }
})
