import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: env.VITE_BASE_PATH || "/",
    server: {
      port: 5173
    },
    build: {
      sourcemap: true,
      target: "es2020"
    }
  };
});
