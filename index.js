import { Client } from "discord.js-selfbot-v13";
import readline from "readline";
import chalk from "chalk";
import dotenv from "dotenv";
import player from "play-sound";
import { spawn } from "child_process";

dotenv.config();

const args = process.argv.slice(2);
const client = new Client();
let playSound = args.includes("--sound=true");

// Global Variables
const gemItems = [];
let spam = false;
let activeChannel = null;

const gemTypeNames = { gem1: "Hunting Gem", gem3: "Empowering Gem", gem4: "Lucky Gem" };
const gemRarityNames = { c: "Common", u: "Uncommon", r: "Rare", e: "Epic", l: "Legendary", f: "Fable" };

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Utility Functions
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomWait = (min, max) => wait(Math.random() * (max - min + 1) * 1000 + min * 1000);
const playSoundEffect = (file) => playSound && player().play(file, (err) => err && console.error(err));
const log = (type, msg) => {
    const chalkTypes = {
        success: chalk.green,
        warning: chalk.yellow,
        error: chalk.red,
        info: chalk.cyan
    };
    const logFunction = chalkTypes[type] || chalk.white;
    console.log(logFunction(`[${type.toUpperCase()}]: ${msg}`));
};
const logDivider = (label) => console.log(chalk.blueBright(`\n${"=".repeat(60)}\n= ${label}${" ".repeat(Math.max(0, 58 - label.length))}=\n${"=".repeat(60)}\n`));

const superscriptMap = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
const convertSuperscriptToNumber = (str) => str.split("").map((char) => superscriptMap[char] || char).join("");

const restartProcess = async () => {
    logDivider("STOPPING THE PROCESS");
    log("warning", "Verification required. Stopping...");
    playSoundEffect("./assets/157795.mp3");
    await wait(2000);
    const child = spawn(process.argv[0], process.argv.slice(1), { stdio: "inherit" });
    child.on("close", (code) => {
        log("error", `Process exited with code ${code}.`);
        process.exit(code);
    });
    process.exit();
};

rl.on("line", (input) => {
    const command = input.trim().toLowerCase();
    if (command === "start") {
        spam = true;
        log("success", "Spam started.");
        if (!activeChannel) log("warning", "Specify a channel by typing in a Discord channel first.");
    } else if (command === "stop") {
        spam = false;
        log("warning", "Stopping the spam...");
    } else {
        log("error", "Unknown command. Use 'start' or 'stop'.");
    }
});

client.on("ready", () => {
    logDivider("OWOBOT FARMING SCRIPT");
    log("success", `Logged in as ${client.user.username}`);
    log("success", `Play Sound: ${playSound}`);
    log("success", "Commands:\nstart   : to start the spam.\nstop   : to stop the spam. (note: it will still run the command one last time)");
});

client.on("messageCreate", async (message) => {
    if (message.channel.type === "DM") return;
    if (message.author.id === client.user.id) handleSelfCommands(message);
    if (activeChannel && message.channel.id === activeChannel.id) handleOwOCommands(message);
});

const handleSelfCommands = (message) => {
    if (message.content === "owo hh") {
        activeChannel = message.channel;
        spam = true;
        log("success", "Channel set and spam started.");
    } else if (message.content === "owo bb") {
        spam = false;
        log("warning", "Stopping the spam...");
    } else if (!activeChannel) {
        activeChannel = message.channel;
        log("success", `Channel set to #${activeChannel.name}.`);
    }
};

const handleOwOCommands = async (message) => {
    const myself = message.guild.members.me?.nickname || client.user.displayName;
    if (message.content.includes(`**====== ${myself}'s Inventory ======**`)) {
        log("info", "Parsing inventory...");
        parseInventory(message.content);
    }
    if (message.author.id === "408785106942164992") {
        if (message.cleanContent.includes(`**🌱 | ${myself}**, hunt`)) {
            await processHuntAndBattle(message);
        } else if (message.components.length && message.components[0].components[0].label === "Verify") {
            spam = false;
            restartProcess();
        }
    }
};

const parseInventory = (content) => {
    const regex = /`(\d+)`(<:|<a:)(cgem|ugem|rgem|egem|lgem|fgem)(\d+):\d+>(\W{2})/g;
    let result;
    while ((result = regex.exec(content)) !== null) {
        const [id, rarityKey, typeKey, amount] = [parseInt(result[1]), result[3].charAt(0), `gem${result[4]}`, parseInt(convertSuperscriptToNumber(result[5]))];
        gemItems.push({ id, type: gemTypeNames[typeKey] || typeKey, rarity: gemRarityNames[rarityKey] || rarityKey, amount });
    }
    log("success", "Inventory parsed successfully.");
    console.table(gemItems, ["id", "type", "rarity", "amount"]);
};

const processHuntAndBattle = async (message) => {
    logDivider("HUNT AND BATTLE");
    if (!gemItems.length) {
        activeChannel.sendTyping();
        await randomWait(1, 3);
        activeChannel.send("owo inv");
    }
    const gemAmounts = extractGemsLeft(message.content);
    log("info", "Gems Remaining:");
    console.table(gemAmounts);
    await handleMissingGems(gemAmounts);
    if (spam) await spamHuntAndBattle();
};

const extractGemsLeft = (content) => {
    const gemAmounts = { "Hunting Gem": 0, "Empowering Gem": 0, "Lucky Gem": 0 };
    const regex = /(gem1|gem3|gem4):\d+>`\[(\d+)/g;
    let result;
    while ((result = regex.exec(content)) !== null) {
        gemAmounts[gemTypeNames[result[1]] || result[1]] = parseInt(result[2]);
    }
    return gemAmounts;
};

const sendCommandWithRandomWait = async (command) => {
    activeChannel.sendTyping();
    await randomWait(1, 2);
    activeChannel.send(command);
};

const handleMissingGems = async (gemAmounts) => {
    for (const [gemType, amount] of Object.entries(gemAmounts)) {
        if (amount === 0) {
            log("warning", `${gemType} has no remaining amount.`);
            const highestIdGem = gemItems.filter((gem) => gem.type === gemType && gem.amount > 0).reduce((highest, current) => (current.id > highest.id ? current : highest), {});
            if (highestIdGem.id) {
                await sendCommandWithRandomWait(`owo use ${highestIdGem.id}`);
                highestIdGem.amount -= 1;
                log("success", `Used ${highestIdGem.rarity} ${highestIdGem.type} (ID: ${highestIdGem.id}). Remaining: ${highestIdGem.amount}`);
            }
        }
    }
};

const spamHuntAndBattle = async () => {
    logDivider("SPAMMING COMMANDS");
    await randomWait(15, 20);
    await sendCommandWithRandomWait("owo h");
    await sendCommandWithRandomWait("owo b");
    log("success", "Commands sent successfully.");
    if (!spam) log("success", "Successfully stopped the spam.");
};

client.login(process.env.TOKEN);
