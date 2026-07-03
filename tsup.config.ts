import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/course-content.ts", "src/exam.ts"],
    format: ["esm"],
    dts: false,
    sourcemap: true,
    clean: true,
    splitting: false,
    publicDir: "public",
});
