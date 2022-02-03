const colors = require("cli-color");
const prompt = require("prompt-sync")();

async function sleep(millis) {
    return new Promise((resolve) => setTimeout(() => resolve(), millis));
}

async function write(s, millis) {
    for (const c of s) {
        process.stdout.write(c);
        await sleep(millis || 30);
    }
    process.stdout.write("\n");
}

async function writeFast(s) {
    for (let i = 4; i < s.length; i += 2) {
        process.stdout.write(s.substring(i - 2, i));
        await sleep(5);
    }
    process.stdout.write("\n");
}

async function writeSubsectionLine() {
    await writeFast(
        "------------------------------------------------------------------"
    );
}

async function writeSectionHeader(header) {
    const length = 68;
    const header_length = header.length;
    const header_start = parseInt(length / 2 - header_length / 2);
    const header_end = header_start + header.length;

    let result = "";
    for (let i = 0; i < header_start - 3; i++) {
        result += "O";
    }

    result += "<O ";
    result += colors.bold(header);
    result += " O>";

    for (let i = header_end + 4; i < length; i++) {
        result += "O";
    }

    await writeFast(result);
}

async function writeSectionLine() {
    await writeFast(
        "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO"
    );
}

function vprompt(message, converter_fn, validation_fn) {
    let result = prompt(message);

    if (converter_fn) {
        result = converter_fn(result);
    }

    return validation_fn(result) ? result : false;
}

function vprompt_loop(message, converter_fn, validation_fn) {
    let result = false;
    do {
        result = vprompt(message, converter_fn, validation_fn);
    } while (result === false);
    return result;
}

async function counter(from, to, sleepTime) {
    for (let i = from; i >= to; i--) {
        process.stdout.write(colors.red.bold(i));
        await sleep(sleepTime);
        process.stdout.clearLine();
    }
    await write(colors.green.bold("GOO!"));
    console.log("");
    await sleep(sleepTime);
}

async function askQuestion(question, answer) {
    await write(colors.white.bold(question));

    const startTime = Date.now();
    const usersAnswer = prompt("> ");
    const answerTime = Date.now() - startTime;

    let correct;
    if (usersAnswer == answer) {
        await write(colors.green("That's right :)"));
        correct = true;
    } else {
        await write(colors.red("That's wrong :("));
        await write(colors.xterm(172)(`${answer} would have been correct ;)`));
        correct = false;
    }

    return {
        correct,
        answerTime,
    };
}

function promptYesNo() {
    const answer = prompt("> ");
    return [
        "y",
        "Y",
        "yes",
        "YES",
        "Yes",
        "ye",
        "ja",
        "Ja",
        "Jo",
        "klar",
        "lezgo",
    ].includes(answer);
}

module.exports = {
    sleep,
    write,
    writeFast,
    writeSubsectionLine,
    writeSectionHeader,
    writeSectionLine,
    counter,
    askQuestion,
    promptYesNo,
    vprompt,
    vprompt_loop,
};
