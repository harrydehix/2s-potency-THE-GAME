const prompt = require("prompt-sync")();
const format = require("sprintf-js").sprintf;
const colors = require("cli-color");

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
    logSectionHeader,
    logSubsectionLine,
    logSectionLine,
} = require("./console_utils");

async function exit() {
    await write(colors.italic.red("Okay bye :("));
    process.exit();
}

const actions = [
    require("./games/2s_potency").game,
    require("./games/bin_hex").game,
    exit,
];

async function game() {
    logSectionHeader("ERA GAME SUITE");
    console.log();
    console.log(`Welcome the the ${colors.italic.red("ERA GAME SUITE")}!`);
    console.log(
        `This is the place to improve your ERA grade by ${colors.bold.green(
            "100000%"
        )}!`
    );
    console.log();
    logSectionLine();
    console.log();

    do {
        await write(colors.bold.blue("Which game do you want to play?"));

        await writeSubsectionLine();

        await write(colors.green.italic("(0) 2s POTENCY - THE GAME"));
        await write(colors.green.italic("(1) BIN<>HEX - THE GAME"));
        await write(colors.red.italic("(2) I don't want to play anymore..."));

        await writeSubsectionLine();

        const selection = vprompt_loop(
            "> ",
            parseInt,
            (val) => val >= 0 && val < actions.length
        );

        await actions[selection]();
    } while (true);
}

game();
