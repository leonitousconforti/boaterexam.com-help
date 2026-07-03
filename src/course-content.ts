// This script should run on any page that starts with:
// https://www.boaterexam.com/course/content/

import * as Schema from "effect/Schema";

const LocationSchema = Schema.TemplateLiteralParser([
    "https://www.boaterexam.com/course/content/",
    Schema.NumberFromString,
]);

const course = Schema.decodeUnknownSync(LocationSchema)(window.location.href)[1];
if ("setTimer" in window && typeof window["setTimer"] === "function") {
    const setTimer = window["setTimer"] as (course: number, time: number) => void;
    setTimeout(() => setTimer(course, 0), 1000);
}
