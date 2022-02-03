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

async function showHighscores() {
    await require("./games/2s_potency").showHighscores();
    await require("./games/bin_hex").showHighscores();
}

const actions = [
    require("./games/2s_potency").game,
    require("./games/bin_hex").game,
    showHighscores,
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

    do {
        console.log();
        await write(colors.bold.blue("What do you want to do?"));

        await writeSubsectionLine();

        await write(
            colors.green(`(0) Play ${colors.bold("2s POTENCY - THE GAME")}`)
        );
        await write(
            colors.green(`(1) Play ${colors.bold("BIN<>HEX - THE GAME")}`)
        );
        await write(colors.magenta(`(2) Show highscores`));
        await write(colors.red.italic("(3) Exit"));

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
