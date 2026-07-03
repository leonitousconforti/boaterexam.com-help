import { defineConfig } from "tsup";

export default defineConfig({
    ignoreWatch: "**/{.git,node_modules,.direnv,chrome}/**",
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
