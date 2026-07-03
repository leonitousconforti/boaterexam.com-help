// This script should run on any page that starts with:
// https://www.boaterexam.com/quizzes/90723409/

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as References from "effect/References";
import * as Schema from "effect/Schema";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import * as BrowserKeyValueStore from "@effect/platform-browser/BrowserKeyValueStore";
import * as BrowserRuntime from "@effect/platform-browser/BrowserRuntime";

const current_question = 1;

const LocationSchema = Schema.TemplateLiteralParser(["https://www.boaterexam.com/quizzes/", Schema.NumberFromString]);
const AnswerSchema = Schema.Struct({ elementId: Schema.String, content: Schema.String });
const ExamSchema = Schema.Record(
    Schema.String,
    Schema.Array(AnswerSchema).check(Schema.isMinLength(1), Schema.isMaxLength(4))
).pipe(Schema.fromJsonString);

const AppLive = Layer.mergeAll(
    BrowserKeyValueStore.layerLocalStorage,
    Layer.succeed(References.MinimumLogLevel, "All")
);

Effect.gen(function* () {
    const storage = yield* KeyValueStore.KeyValueStore;

    const exam = Schema.decodeUnknownSync(LocationSchema)(window.location.href)[1];
    const maybeCurrentExam = yield* storage.get(`boaterexam.com-help_exam_${exam}`);
    const currentExam = maybeCurrentExam === undefined ? {} : yield* Schema.decodeEffect(ExamSchema)(maybeCurrentExam);

    const questionText = document
        .querySelector<HTMLLegendElement>(`#question_${current_question} #question-text`)!
        .textContent.trim();

    const answerLabels = document.querySelectorAll<HTMLLabelElement>(
        `#question_${current_question} .assessment-item label`
    );

    const answers = Array.from(answerLabels).map((label) => ({
        elementId: label.id,
        content: label.textContent.trim(),
    }));

    const updatedExam =
        currentExam[questionText] !== undefined ? currentExam : { ...currentExam, [questionText]: answers };
    const randomAnswer = updatedExam[questionText][Math.floor(Math.random() * updatedExam[questionText].length)];

    const updatedExamString = yield* Schema.encodeEffect(ExamSchema)(updatedExam);
    yield* storage.set(`boaterexam.com-help_exam_${exam}`, updatedExamString);

    const randomAnserInput = document.querySelector<HTMLLabelElement>(`#${randomAnswer.elementId}`)!;
    setTimeout(() => randomAnserInput.click(), 1000);

    const submitButton = document.querySelector<HTMLInputElement>(`#question_${current_question} [name="commit"]`)!;
    setTimeout(() => submitButton.click(), 2000);
}).pipe(Effect.provide(AppLive), BrowserRuntime.runMain);
