import type * as Types from "effect/Types";

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as References from "effect/References";
import * as Schema from "effect/Schema";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import * as BrowserKeyValueStore from "@effect/platform-browser/BrowserKeyValueStore";
import * as BrowserRuntime from "@effect/platform-browser/BrowserRuntime";

// const LocationSchema = Schema.TemplateLiteralParser([
//     "https://www.boaterexam.com/quizzes/",
//     Schema.FiniteFromString,
//     "/",
// ]);

const ChapterSchema = Schema.TemplateLiteralParser(["Chapter ", Schema.FiniteFromString, " Quiz", Schema.String]);
const ExamSchema = Schema.Record(Schema.String, Schema.UndefinedOr(Schema.String)).pipe(Schema.fromJsonString);

const AppLive = Layer.mergeAll(
    BrowserKeyValueStore.layerLocalStorage,
    Layer.succeed(References.MinimumLogLevel, "All")
);

const loadExam: Effect.Effect<
    Schema.Schema.Type<typeof ExamSchema>,
    KeyValueStore.KeyValueStoreError | Schema.SchemaError,
    KeyValueStore.KeyValueStore
> = Effect.gen(function* () {
    const storage = yield* KeyValueStore.KeyValueStore;

    const currentChapterString = document.querySelector<HTMLTitleElement>("title")!.innerText;
    const [_, currentChapter, __] = yield* Schema.decodeUnknownEffect(ChapterSchema)(currentChapterString);

    const examString = yield* storage.get(`boaterexam.com-help_exam_${currentChapter}`);
    return examString === undefined ? {} : yield* Schema.decodeEffect(ExamSchema)(examString);
});

const writeExam = (
    exam: Types.Mutable<Schema.Schema.Type<typeof ExamSchema>>
): Effect.Effect<void, KeyValueStore.KeyValueStoreError | Schema.SchemaError, KeyValueStore.KeyValueStore> =>
    Effect.gen(function* () {
        const storage = yield* KeyValueStore.KeyValueStore;

        const currentChapterString = document.querySelector<HTMLTitleElement>("title")!.innerText;
        const [_, currentChapter, __] = yield* Schema.decodeUnknownEffect(ChapterSchema)(currentChapterString);

        const updatedExamString = yield* Schema.encodeEffect(ExamSchema)(exam);
        yield* storage.set(`boaterexam.com-help_exam_${currentChapter}`, updatedExamString);
    });

const takeExam = Effect.gen(function* () {
    const instructions = document.querySelector<HTMLDivElement>("#instructions")!;
    if (instructions.checkVisibility()) {
        const startAssessmentButton = document.querySelector<HTMLButtonElement>("#instructions button")!;
        startAssessmentButton.click();
    }

    const currentQuestionString = document.querySelector<HTMLDivElement>(".current_question")!.textContent;
    const currentQuestion = yield* Schema.decodeEffect(Schema.FiniteFromString)(currentQuestionString);

    const totalQuestionsString = document.querySelector<HTMLDivElement>(".total_questions")!.textContent;
    const totalQuestions = yield* Schema.decodeEffect(Schema.FiniteFromString)(totalQuestionsString);

    for (let questionNumber = currentQuestion; questionNumber <= totalQuestions; questionNumber++) {
        const exam = yield* loadExam;

        const questionText = document
            .querySelector<HTMLLegendElement>(`#question_${questionNumber} #question-text`)!
            .textContent.trim();

        const answerLabels = Array.from(
            document.querySelectorAll<HTMLLabelElement>(`#question_${questionNumber} .assessment-item label`)
        );

        const answersText = answerLabels.map((label) => label.textContent.trim()).sort();
        const questionKey = `${questionText}-${answersText.join("-")}`;

        const maybeCorrectAnswer = exam[questionKey];
        const randomAnswer = answersText[Math.floor(Math.random() * answersText.length)];
        const answerInput = answerLabels.find(
            (label) => label.textContent.trim() === (maybeCorrectAnswer ?? randomAnswer)
        )!;

        const updatedExam = { ...exam, [questionKey]: maybeCorrectAnswer ?? randomAnswer };
        yield* writeExam(updatedExam);

        yield* Effect.sleep(1000);
        answerInput.click();

        const submitButton = document.querySelector<HTMLInputElement>(`#question_${questionNumber} [name="commit"]`)!;
        yield* Effect.sleep(1000);
        submitButton.click();
    }

    const viewResultsButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
        (button) => button.textContent.trim() === "View Results"
    )!;

    while (!viewResultsButton.checkVisibility()) {
        yield* Effect.sleep(300);
    }

    viewResultsButton.click();
});

const reviewExam = Effect.gen(function* () {
    const exam = yield* loadExam;
    const critiques = document.querySelectorAll<HTMLDivElement>(".critique-item");
    for (const question of critiques) {
        const questionText = question
            .querySelector<HTMLDivElement>(".critique-question div:nth-child(2)")!
            .textContent.trim();

        const correctAnswer = Array.from(question.querySelectorAll<HTMLDivElement>(".critique-anwser"))
            .find((div) => div.querySelector<HTMLImageElement>('img[alt="Correct"]') !== null)!
            .textContent.trim();

        const incorrectAnswers = Array.from(question.querySelectorAll<HTMLDivElement>(".critique-anwser"))
            .filter((div) => div.querySelector<HTMLImageElement>('img[alt="Incorrect"]') !== null)
            .map((div) => div.innerText.trim())
            .map((text) => text.replace("Your Answer", "").trim());

        const allAnswersSorted = [correctAnswer, ...incorrectAnswers].sort();
        const questionKey = `${questionText}-${allAnswersSorted.join("-")}`;
        (exam as Types.Mutable<typeof exam>)[questionKey] = correctAnswer;
    }

    yield* writeExam(exam);
    const nextButton = document.querySelector<HTMLAnchorElement>(".course-controls-group a:nth-of-type(2)")!;
    nextButton.click();
});

Effect.gen(function* () {
    const viewCritiqueButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
        (button) => button.textContent.trim() === "View Critique"
    );

    if (viewCritiqueButton && viewCritiqueButton.checkVisibility()) {
        yield* reviewExam;
    } else {
        yield* takeExam;
    }
}).pipe(Effect.provide(AppLive), BrowserRuntime.runMain);
