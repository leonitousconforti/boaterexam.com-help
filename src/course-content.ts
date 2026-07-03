import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as References from "effect/References";
import * as Schema from "effect/Schema";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import * as BrowserKeyValueStore from "@effect/platform-browser/BrowserKeyValueStore";
import * as BrowserRuntime from "@effect/platform-browser/BrowserRuntime";

const LocationSchema = Schema.TemplateLiteralParser([
    "https://www.boaterexam.com/course/content/",
    Schema.FiniteFromString,
    "/",
]);

const AppLive = Layer.mergeAll(
    BrowserKeyValueStore.layerLocalStorage,
    Layer.succeed(References.MinimumLogLevel, "All")
);

Effect.gen(function* () {
    const storage = yield* KeyValueStore.KeyValueStore;
    const [_, course] = yield* Schema.decodeUnknownEffect(LocationSchema)(window.location.href);

    const modalDialog = document.querySelector<HTMLDivElement>(".modal-dialog");
    if (modalDialog?.checkVisibility()) {
        const closeButton = modalDialog.querySelector<HTMLButtonElement>(".modal-dialog button")!;
        setTimeout(() => closeButton.click(), 100);
        while (modalDialog?.checkVisibility()) yield* Effect.sleep(100);
    }

    yield* Effect.sleep(300);
    yield* storage.set(`${course}-timer`, "0");

    const nextButton = document.querySelector<HTMLButtonElement>("#next-button a")!;
    while (!nextButton.checkVisibility()) {
        yield* Effect.sleep(300);
    }

    yield* Effect.sleep(600);
    nextButton.click();
}).pipe(Effect.provide(AppLive), BrowserRuntime.runMain);
