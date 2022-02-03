const prompt = require("prompt-sync")();
const format = require("sprintf-js").sprintf;
const colors = require("cli-color");
const uuid = require("uuid");
const path = require("path");

const {
    sleep,
    write,
    writeFast,
    writeSectionHeader,
    writeSectionLine,
    writeSubsectionLine,
    counter,
    askQuestion,
    promptYesNo,
    vprompt_loop,
} = require("../console_utils");
const { randint } = require("../random_utils");
const {
    getRecords,
    storeRecords,
    updateRecords,
} = require("../record_storing");

function up(number) {
    number = number.toString();
    let upNumber = "";
    const alphabet = "⁰¹²³⁴⁵⁶⁷⁸⁹";
    for (const c of number) {
        upNumber += alphabet[parseInt(c)];
    }
    return upNumber;
}

const recordsFilePath =
    path.dirname(process.execPath) + "/2s_potency_records.json";
function createRecord(
    questionCount,
    secondsPerQuestion,
    correctOnes,
    difficultyLevel
) {
    return {
        id: uuid.v4(),
        questionCount,
        secondsPerQuestion,
        score:
            (difficultyLevel * questionCount * (correctOnes / questionCount)) /
            secondsPerQuestion,
        percentage: correctOnes / questionCount,
        difficultyLevel,
    };
}

function parseDifficultyLevel(input) {
    if (["1", "e", "E", "easy", "Easy", "EASY"].includes(input)) {
        return 1;
    }
    if (["2", "m", "M", "medium", "Medium", "MEDIUM"].includes(input)) {
        return 2;
    }
    if (["3", "h", "H", "heavy", "Heavy", "HEAVY"].includes(input)) {
        return 3;
    }
    return -1;
}

function difficultyAsString(difficultyLevel) {
    switch (difficultyLevel) {
        case 1:
            return "e";
        case 2:
            return "m";
        case 3:
            return "h";
    }
}

function getMaxByDifficulty(difficultyLevel) {
    switch (difficultyLevel) {
        case 1:
            return 4;
        case 2:
            return 7;
        case 3:
            return 12;
    }
}

function generateQuestion(difficulty, questionBefore) {
    const max = getMaxByDifficulty(difficulty);
    const min = 0;

    let question;
    do {
        question = randint(min, max);
    } while (questionBefore !== null && question === questionBefore.question);

    return {
        question,
        answer: 2 ** question,
    };
}

async function showHighscores(record) {
    let records = await getRecords(recordsFilePath);
    if (record !== undefined) {
        records = updateRecords(records, record);
        await storeRecords(recordsFilePath, records);
    }

    await writeSectionHeader("2s POTENCY - HIGH SCORES");
    console.log();

    if (records.length === 0) {
        console.log("Empty!");
    }

    for (let i = 0; i < records.length; i++) {
        let message = `${format(
            "%11s",
            colors.bold((i + 1).toString())
        )}}${format(
            "%32s",
            colors.green.bold(records[i].score.toFixed(2).toString())
        ).replace(/\s/g, ".")} ${colors.italic("ERA-POINTS")} (${format(
            "%6s",
            (records[i].percentage * 100).toFixed(2).toString()
        )}%, ${format(
            "%5s",
            records[i].secondsPerQuestion.toFixed(2).toString()
        )}spq, ${format("%2s", records[i].questionCount.toString())}q, ${format(
            "%1s",
            difficultyAsString(records[i].difficultyLevel)
        )})`;
        if (record !== undefined && records[i].id === record.id) {
            message += colors.green.bold(" NEW!");
        }
        await writeFast(message);
    }
    console.log();
    await writeSectionLine();
}

async function game() {
    await sleep(100);

    await writeSubsectionLine();
    await write(colors.green.bold('WELCOME TO "2s POTENCY - THE GAME"!'));
    await writeSubsectionLine();

    await sleep(500);

    await write(colors.blue("How many questions do you want?"));
    const questionCount = vprompt_loop("> ", parseInt, (val) => val >= 1);

    await write(colors.blue("How tough do you want it? (easy, medium, heavy)"));
    const difficultyLevel = vprompt_loop(
        "> ",
        parseDifficultyLevel,
        (val) => val !== -1
    );

    await write(colors.blue("Are you ready to get better in ERA?"));
    if (!promptYesNo()) {
        await write(colors.italic.red("Okay bye!"));
        await writeSubsectionLine();
        return;
    }

    await writeSubsectionLine();
    console.log();

    await counter(3, 1, 1000);

    let correctOnes = 0;
    let questionBefore = null;
    let timeSum = 0;
    for (let i = questionCount; i >= 1; i--) {
        const question = generateQuestion(difficultyLevel, questionBefore);
        questionBefore = question;

        const result = await askQuestion(
            `2${up(question.question)}`,
            question.answer
        );

        if (result.correct) {
            correctOnes++;
        }
        timeSum += result.answerTime;

        console.log();
        await sleep(250);
    }
    await write(colors.blue.bold("   FINISHED!"));
    console.log();
    await writeSectionHeader("RESULT");
    console.log();

    const timeInSeconds = timeSum / 1000;
    const secondsPerQuestion = timeInSeconds / questionCount;
    const record = createRecord(
        questionCount,
        secondsPerQuestion,
        correctOnes,
        difficultyLevel
    );

    await write(
        `${colors.bold(correctOnes)} of ${colors.bold(
            questionCount
        )} answers were correct!`
    );
    await write(
        `That's ${colors.underline((record.percentage * 100).toFixed(2))}%`
    );

    await writeSubsectionLine();

    await write(
        `You needed ${colors.bold(timeInSeconds.toFixed(2) + "s")} to answer.`
    );
    await write(
        `That's ${colors.bold(
            secondsPerQuestion.toFixed(2) + "s"
        )} per question.`
    );

    await writeSubsectionLine();
    await write(
        `${colors.blue.bold(record.score.toFixed(2))} ${colors.italic(
            "ERA-POINTS"
        )}`
    );

    console.log();
    await showHighscores(record);
}

module.exports = {
    game,
    showHighscores,
};
