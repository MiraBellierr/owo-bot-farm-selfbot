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
let useStar = args.includes("--star=true");

// Global Variables
const gemItems = [];
let spam = false;
let activeChannel = null;

const gemTypeNames = { gem1: "Hunting Gem", gem3: "Empowering Gem", gem4: "Lucky Gem", star: "Star" };
const gemRarityNames = { c: "Common", u: "Uncommon", r: "Rare", e: "Epic", m: "Mythical", l: "Legendary", f: "Fable" };
const gemRarityOrder = ["Common", "Uncommon", "Rare", "Epic", "Mythical", "Legendary", "Fable"];

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
        log("success", "Spam started. Send \"owoh\" in the desired channel to set it as active.");
        if (!activeChannel) log("warning", "Specify a channel by typing \"owo h\" in the desired channel to set it as active.");
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
    log("success", `Use Star: ${useStar}`);
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
        await parseInventory(message.content);
    }
    if (message.author.id === "408785106942164992") {
        if (message.cleanContent.includes(`**🌱 | ${myself}**, hunt`) || message.cleanContent.includes(`**🌱 | ${myself}** spent`)) {
            await processHuntAndBattle(message);
        } else if (message.components?.[0]?.components?.[0]?.label === "Verify") {
            spam = false;
            restartProcess();
        }
    }
};

const parseInventory = async (content) => {
    const regex = /`(\d+)`(<:|<a:)(?:([curemlf])gem([134])|([curemlf])star):\d+>(\W{2})/g;
    let result;
    while ((result = regex.exec(content)) !== null) {
        const [id, rarityKey, gemTypeKey, starRarityKey, amount] = [parseInt(result[1]), result[3], result[4], result[5], parseInt(convertSuperscriptToNumber(result[6]))];
        if (starRarityKey) {
            gemItems.push({ id, type: "Star", rarity: gemRarityNames[starRarityKey] || starRarityKey, amount });
        } else {
            const typeKey = `gem${gemTypeKey}`;
            gemItems.push({ id, type: gemTypeNames[typeKey] || typeKey, rarity: gemRarityNames[rarityKey] || rarityKey, amount });
        }
    }
    log("success", "Inventory parsed successfully.");
    console.table(gemItems, ["id", "type", "rarity", "amount"]);
    if (content.includes("box:")) {
        log("info", "Box found in inventory, sending 'owo lb all'...");
        await sendCommandWithRandomWait("owo lb all");
    }
    if (content.includes("crate:")) {
        log("info", "Crate found in inventory, sending 'owo wc all'...");
        await sendCommandWithRandomWait("owo wc all");
    }
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
    const gemAmounts = { "Hunting Gem": 0, "Empowering Gem": 0, "Lucky Gem": 0, "Star": 0 };
    const regex = /(gem1|gem3|gem4|star):\d+>`\[(\d+)/g;
    let result;
    while ((result = regex.exec(content)) !== null) {
        gemAmounts[gemTypeNames[result[1]] || result[1]] = parseInt(result[2]);
    }
    return gemAmounts;
};

const sendCommandWithRandomWait = async (command) => {
    activeChannel.sendTyping();
    await randomWait(6, 7);
    activeChannel.send(command);
};

const handleMissingGems = async (gemAmounts) => {
    for (const [gemType, amount] of Object.entries(gemAmounts)) {
        if (gemType === "Star" && !useStar) {
            log("info", "Ignoring Star usage. Use --star=true to enable it.");
            continue;
        }
        if (amount === 0) {
            log("warning", `${gemType} has no remaining amount.`);
            const candidates = gemItems.filter((gem) => gem.type === gemType && gem.amount > 0);
            const highestRarityGem = candidates.reduce((highest, current) => {
                const highestRank = gemRarityOrder.indexOf(highest.rarity);
                const currentRank = gemRarityOrder.indexOf(current.rarity);
                if (currentRank !== highestRank) return currentRank > highestRank ? current : highest;
                return current.id > highest.id ? current : highest;
            }, {});
            if (highestRarityGem.id) {
                await sendCommandWithRandomWait(`owo use ${highestRarityGem.id}`);
                highestRarityGem.amount -= 1;
                log("success", `Used ${highestRarityGem.rarity} ${highestRarityGem.type} (ID: ${highestRarityGem.id}). Remaining: ${highestRarityGem.amount}`);
            }
        }
    }
};

const spamHuntAndBattle = async () => {
    logDivider("SPAMMING COMMANDS");
    log("info", "Starting spam of 'owo h' and 'owo b' commands. ~20 seconds delay between each command.");
    await randomWait(15, 20);
    await sendCommandWithRandomWait("owo h");
    await sendCommandWithRandomWait("owo b");
    log("success", "Commands sent successfully.");
    if (!spam) log("success", "Successfully stopped the spam.");
};

client.login(process.env.TOKEN);
