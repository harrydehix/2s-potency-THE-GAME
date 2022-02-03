const prompt = require("prompt-sync")();
const format = require("sprintf-js").sprintf;
const fs = require("fs/promises");
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
    promptYesNo,
    vprompt_loop,
    askQuestion,
} = require("../console_utils");
const { randint } = require("../random_utils");
const {
    getRecords,
    storeRecords,
    updateRecords,
} = require("../record_storing");

function randhex() {
    return [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
    ][randint(0, 15)];
}

function randbin() {
    return [
        "0000",
        "0001",
        "0010",
        "0011",
        "0100",
        "0101",
        "0110",
        "0111",
        "1000",
        "1001",
        "1010",
        "1011",
        "1100",
        "1101",
        "1110",
        "1111",
    ][randint(0, 15)];
}

function hex_to_bin(hex) {
    switch (hex) {
        case "0":
            return "0000";
        case "1":
            return "0001";
        case "2":
            return "0010";
        case "3":
            return "0011";
        case "4":
            return "0100";
        case "5":
            return "0101";
        case "6":
            return "0110";
        case "7":
            return "0111";
        case "8":
            return "1000";
        case "9":
            return "1001";
        case "A":
            return "1010";
        case "B":
            return "1011";
        case "C":
            return "1100";
        case "D":
            return "1101";
        case "E":
            return "1110";
        case "F":
            return "1111";
    }
}

function bin_to_hex(bin) {
    switch (bin) {
        case "0000":
            return "0";
        case "0001":
            return "1";
        case "0010":
            return "2";
        case "0011":
            return "3";
        case "0100":
            return "4";
        case "0101":
            return "5";
        case "0110":
            return "6";
        case "0111":
            return "7";
        case "1000":
            return "8";
        case "1001":
            return "9";
        case "1010":
            return "A";
        case "1011":
            return "B";
        case "1100":
            return "C";
        case "1101":
            return "D";
        case "1110":
            return "E";
        case "1111":
            return "F";
    }
}

const recordsFilePath =
    path.dirname(process.execPath) + "/bin_hex_records.json";
function createRecord(
    questionCount,
    secondsPerQuestion,
    correctOnes,
    difficultyLevel,
    mode
) {
    return {
        id: uuid.v4(),
        questionCount,
        secondsPerQuestion,
        score:
            (modeWeight(mode) *
                difficultyLevel *
                questionCount *
                (correctOnes / questionCount)) /
            secondsPerQuestion,
        percentage: correctOnes / questionCount,
        difficultyLevel,
        mode,
    };
}

function parseDifficultyLevel(input) {
    if (["1", "e", "E", "easy", "Easy", "EASY"].includes(input)) {
        return 1;
    }
    if (["2", "m", "M", "medium", "Medium", "MEDIUM"].includes(input)) {
        return 2.5;
    }
    if (["3", "h", "H", "heavy", "Heavy", "HEAVY"].includes(input)) {
        return 4;
    }
    return -1;
}

function difficultyAsString(difficultyLevel) {
    switch (difficultyLevel) {
        case 1:
            return "e";
        case 2.5:
            return "m";
        case 4:
            return "h";
    }
}

function getNibbleCountByDifficulty(difficultyLevel) {
    switch (difficultyLevel) {
        case 1:
            return 1;
        case 2.5:
            return 2;
        case 4:
            return 3;
    }
}

function generateQuestion(difficulty, mode, questionBefore) {
    let generatorFunction;
    let resultFunction;

    if (mode === "mixed") {
        mode = randint(0, 1) === 0 ? "bin2hex" : "hex2bin";
    }
    switch (mode) {
        case "bin2hex":
            generatorFunction = randbin;
            resultFunction = bin_to_hex;
            break;
        case "hex2bin":
            generatorFunction = randhex;
            resultFunction = hex_to_bin;
            break;
    }

    let question;
    let answer;
    do {
        question = "";
        answer = "";
        const nibbleCount = getNibbleCountByDifficulty(difficulty);
        for (let i = 0; i < nibbleCount; i++) {
            const nibble = generatorFunction();
            answer += resultFunction(nibble);
            question += nibble;
            if (i + 1 !== nibbleCount) {
                if (generatorFunction === randbin) {
                    question += "_";
                } else {
                    answer += "_";
                }
            }
        }
        if (questionBefore === null) {
            break;
        }
    } while (question === questionBefore.question);
    return {
        question,
        answer,
    };
}

function parseMode(input) {
    if (
        [
            "bin2hex",
            "bh",
            "BH",
            "B",
            "b",
            "0",
            "Bin2Hex",
            "Bin2hex",
            "BIN2HEX",
        ].includes(input)
    ) {
        return "bin2hex";
    }
    if (
        [
            "hex2bin",
            "hb",
            "HB",
            "H",
            "b",
            "1",
            "Hex2Bin",
            "Hex2bin",
            "HEX2Bin",
        ].includes(input)
    ) {
        return "hex2bin";
    }
    if (["mixed", "m", "M", "2", "Mixed", "MIXED"].includes(input)) {
        return "mixed";
    }
    return -1;
}

function modeWeight(mode) {
    switch (mode) {
        case "hex2bin":
        case "bin2hex":
            return 1;
    }
    return 1.5;
}

async function showHighscores(record) {
    let records = await getRecords(recordsFilePath);
    if (record !== undefined) {
        records = updateRecords(records, record);
        await storeRecords(recordsFilePath, records);
    }

    console.log();
    await writeSectionHeader("BIN<>HEX - HIGH SCORES");
    console.log();

    if (records.length === 0) {
        console.log("Did you expect a needle?");
    }

    for (let i = 0; i < records.length; i++) {
        let message = `${format(
            "%11s",
            colors.bold((i + 1).toString())
        )}}${format(
            "%32s",
            colors.green.bold(records[i].score.toFixed(2).toString())
        ).replace(/\s/g, ".")} ${colors.italic("ERA-POINTS")} (${format(
            "%7s",
            (records[i].percentage * 100).toFixed(2).toString()
        )}%, ${format(
            "%5s",
            records[i].secondsPerQuestion.toFixed(2).toString()
        )}spq, ${format(
            "%3s",
            records[i].questionCount.toString()
        )}q, ${difficultyAsString(records[i].difficultyLevel)}, ${format(
            "%7s",
            records[i].mode
        )})`;
        if (records[i].id === record.id) {
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
    await write(colors.green.bold('WELCOME TO "BIN<>HEX - THE GAME"!'));
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

    await write(colors.blue("Choose a mode (bin2hex, hex2bin, mixed)"));
    const mode = vprompt_loop("> ", parseMode, (val) => val !== -1);

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
    let timeSum = 0;
    let questionBefore = null;
    for (let i = questionCount; i >= 1; i--) {
        const question = generateQuestion(
            difficultyLevel,
            mode,
            questionBefore
        );
        questionBefore = question;

        const result = await askQuestion(question.question, question.answer);

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
        difficultyLevel,
        mode
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

    await showHighscores(record);
}

module.exports = {
    game,
    showHighscores,
};
