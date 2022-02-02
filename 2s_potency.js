const prompt = require("prompt-sync")();
const fs = require("fs/promises");
const colors = require("cli-color");

const sleep = (millis) =>
    new Promise((resolve) => setTimeout(() => resolve(), millis));

const write = async (s, millis) => {
    for (const c of s) {
        process.stdout.write(c);
        await sleep(millis || 30);
    }
    process.stdout.write("\n");
};

const writeFast = async (s) => {
    await write(s, 10);
};

function randint(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max + 1 - min)) + min;
}

function up(number) {
    number = number.toString();
    let upNumber = "";
    const alphabet = "⁰¹²³⁴⁵⁶⁷⁸⁹";
    for (const c of number) {
        upNumber += alphabet[parseInt(c)];
    }
    return upNumber;
}

async function getRecords() {
    try {
        return JSON.parse(await fs.readFile("records.json", "utf8"));
    } catch (err) {
        await fs.writeFile("records.json", JSON.stringify([]));
        return [];
    }
}

function updateRecords(records, potentialRecord) {
    records.push(potentialRecord);
    records.sort((a, b) => {
        return b.score - a.score;
    });
    return records.slice(0, 10);
}

async function storeRecords(records) {
    try {
        await fs.writeFile("records.json", JSON.stringify(records));
    } catch (err) {
        console.error(err);
    }
}

function createRecord(
    questionCount,
    secondsPerQuestion,
    correctOnes,
    difficultyLevel
) {
    return {
        questionCount,
        secondsPerQuestion,
        score:
            (difficultyLevel * questionCount * (correctOnes / questionCount)) /
            secondsPerQuestion,
        percentage: correctOnes / questionCount,
        difficultyLevel,
    };
}

function parseDifficultyLevel(difficulty) {
    if (
        difficulty === "1" ||
        difficulty === "e" ||
        difficulty === "E" ||
        difficulty === "easy" ||
        difficulty === "Easy" ||
        difficulty === "EASY"
    ) {
        return 1;
    }
    if (
        difficulty === "2" ||
        difficulty === "m" ||
        difficulty === "M" ||
        difficulty === "medium" ||
        difficulty === "Medium" ||
        difficulty === "MEDIUM"
    ) {
        return 2;
    }
    return 3;
}

function difficultyAsString(difficultyLevel) {
    switch (difficultyLevel) {
        case 1:
            return "e";
        case 2:
            return "m";
        case 3:
            return "d";
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

async function game() {
    await sleep(100);
    await writeFast(
        "----------------------------------------------------------"
    );
    await write(colors.green.bold('WELCOME TO "2s POTENCY - THE GAME"!'));
    await writeFast(
        "----------------------------------------------------------"
    );
    await sleep(500);
    await write(colors.blue("How many questions do you want?"));
    const questionCount = parseInt(prompt("> "));
    await write(colors.blue("How tough do you want it? (easy, medium, heavy)"));
    const difficultyLevel = parseDifficultyLevel(prompt("> "));
    await write(colors.blue("Are you ready to get better in ERA?"));
    const answer = prompt("> ");
    if (
        answer !== "y" &&
        answer !== "Y" &&
        answer !== "yes" &&
        answer !== "YES" &&
        answer !== "Yes" &&
        answer !== "ye" &&
        answer !== "ja" &&
        answer !== "Ja" &&
        answer !== "Jo" &&
        answer !== "jo" &&
        answer !== "klar" &&
        answer !== "lezgo"
    ) {
        await write("Okay bye!");
        return;
    }
    await writeFast(
        "----------------------------------------------------------"
    );
    console.log();
    for (let i = 3; i >= 1; i--) {
        process.stdout.write(colors.red.bold(i));
        await sleep(1000);
        process.stdout.clearLine();
    }
    await write(colors.green.bold("GOO!"));
    console.log("");
    await sleep(1000);

    const max = getMaxByDifficulty(difficultyLevel);
    const min = 0;
    let correctOnes = 0;
    let lastPotency = null;
    let timeSum = 0;
    for (let i = questionCount; i >= 1; i--) {
        let potency = randint(min, max);
        while (potency === lastPotency) {
            potency = randint(min, max);
        }
        lastPotency = potency;
        const result = 2 ** potency;
        await write(colors.white.bold(`2${up(potency)}`));
        const startTime = Date.now();
        const answer = prompt("> ");
        timeSum += Date.now() - startTime;
        if (answer == result) {
            await write(colors.green("That's right :)"));
            correctOnes++;
        } else {
            await write(colors.red("That's wrong :("));
            await write(
                colors.xterm(172)(`${result} would have been correct ;)`)
            );
        }
        console.log();
        await sleep(250);
    }
    await write(colors.blue.bold("   FINISHED!"));
    console.log();
    await writeFast(
        `OOOOOOOOOOOOOOOOOOOOOOO<O ${colors.bold(
            "RESULT"
        )} O>OOOOOOOOOOOOOOOOOOOOOOOO`
    );
    console.log();

    const timeInSeconds = timeSum / 1000;
    const secondsPerQuestion = timeInSeconds / questionCount;
    const record = createRecord(
        questionCount,
        secondsPerQuestion,
        correctOnes,
        difficultyLevel
    );

    let records = await getRecords();
    records = updateRecords(records, record);
    storeRecords(records);

    await write(
        `${colors.bold(correctOnes)} of ${colors.bold(
            questionCount
        )} answers were correct!`
    );
    await write(
        `That's ${colors.underline((record.percentage * 100).toFixed(2))}%`
    );

    await writeFast(
        "----------------------------------------------------------"
    );

    await write(`You needed ${colors.bold(timeInSeconds + "s")} to answer.`);
    await write(
        `That's ${colors.bold(secondsPerQuestion + "s")} per question.`
    );

    await writeFast(
        "----------------------------------------------------------"
    );
    await write(
        `${colors.blue.bold(record.score.toFixed(2))} ${colors.italic(
            "ERA-POINTS"
        )}`
    );
    console.log();
    await writeFast(
        `OOOOOOOOOOOOOOOOOOOOOOO<O ${colors.bold(
            "RECORDS"
        )} O>OOOOOOOOOOOOOOOOOOOOOOO`
    );
    console.log();
    for (let i = 0; i < records.length; i++) {
        let message = `${colors.bold(
            (i + 1).toString()
        )}....... ${colors.green.bold(
            records[i].score.toFixed(2).toString()
        )} ${colors.italic("ERA-POINTS")} (${(
            records[i].percentage * 100
        ).toFixed(2)}%, ${records[i].secondsPerQuestion.toFixed(2)}spq, ${
            records[i].questionCount
        }q, ${difficultyAsString(records[i].difficultyLevel)})`;
        if (records[i] === record) {
            message += colors.green.bold(" NEW!");
        }
        await writeFast(message);
    }
    console.log();
    await writeFast(
        "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO"
    );
}

game();
