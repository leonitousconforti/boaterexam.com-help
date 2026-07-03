import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/course-content.ts", "src/exam.ts"],
    format: ["esm"],
    bundle: true,
    splitting: false,
    noExternal: [/./],
    dts: false,
    sourcemap: true,
    clean: true,
    publicDir: "public",
    treeshake: "smallest",
});
