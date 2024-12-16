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

const gemTypeNames = {
	gem1: "Hunting Gem",
	gem3: "Empowering Gem",
	gem4: "Lucky Gem",
};

const gemRarityNames = {
	c: "Common",
	u: "Uncommon",
	r: "Rare",
	e: "Epic",
	l: "Legendary",
	f: "Fable",
};

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

// Utility Functions
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomWait = (minSeconds, maxSeconds) =>
	wait(
		Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) * 1000 +
			minSeconds * 1000
	);

const playSoundEffect = (file) => {
	if (playSound) {
		player().play(file, (err) => {
			if (err) console.error(err);
		});
	}
};

const logDivider = (label) => {
	const width = 60;
	const pad = Math.max(0, width - label.length - 2);
	console.log(
		chalk.blueBright(
			`\n${"=".repeat(width)}\n= ${label}${" ".repeat(pad)}=\n${"=".repeat(
				width
			)}\n`
		)
	);
};

const logInfo = (msg) => console.log(chalk.cyan(`[INFO]: ${msg}`));
const logWarning = (msg) => console.log(chalk.yellow(`[WARNING]: ${msg}`));
const logError = (msg) => console.log(chalk.red(`[ERROR]: ${msg}`));
const logSuccess = (msg) => console.log(chalk.green(`[SUCCESS]: ${msg}`));

// Superscript Conversion
const superscriptMap = {
	"⁰": "0",
	"¹": "1",
	"²": "2",
	"³": "3",
	"⁴": "4",
	"⁵": "5",
	"⁶": "6",
	"⁷": "7",
	"⁸": "8",
	"⁹": "9",
};
const convertSuperscriptToNumber = (superscriptString) =>
	superscriptString
		.split("")
		.map((char) => superscriptMap[char] || char)
		.join("");

// Restart Process
const restartProcess = async () => {
	logDivider("STOPPING THE PROCESS");
	logWarning("Verification required. Stopping...");
	playSoundEffect("./assets/157795.mp3");

	await wait(2000);

	const child = spawn(process.argv[0], process.argv.slice(1), {
		stdio: "inherit",
	});
	child.on("close", (code) => logError(`Process exited with code ${code}.`));

	process.exit();
};

// Command Input Handler
rl.on("line", (input) => {
	const command = input.trim().toLowerCase();
	switch (command) {
		case "start":
			spam = true;
			logSuccess("Spam started.");
			if (!activeChannel)
				logWarning("Specify a channel by typing in a Discord channel first.");
			break;
		case "stop":
			spam = false;
			logWarning("Stopping the spam...");
			break;
		default:
			logError("Unknown command. Use 'start' or 'stop'.");
	}
});

// Discord Events
client.on("ready", () => {
	logDivider("OWOBOT FARMING SCRIPT");
	logSuccess(`Logged in as ${client.user.username}`);
	logSuccess(`Play Sound: ${playSound}`);
	logSuccess("Commands:");
	logSuccess("start   : to start the spam.");
	logSuccess(
		"stop   : to stop the spam. (note: it will still run the command one last time)"
	);
});

client.on("messageCreate", async (message) => {
	if (message.channel.type === "DM") return;

	if (message.author.id === client.user.id) {
		handleSelfCommands(message);
	}

	if (activeChannel && message.channel.id === activeChannel.id) {
		handleOwOCommands(message);
	}
});

const handleSelfCommands = (message) => {
	switch (message.content) {
		case "owo hh":
			activeChannel = message.channel;
			spam = true;
			logSuccess("Channel set and spam started.");
			break;
		case "owo bb":
			spam = false;
			logWarning("Stopping the spam...");
			break;
		default:
			if (!activeChannel) {
				activeChannel = message.channel;
				logInfo(`Channel set to #${activeChannel.name}.`);
			}
	}
};

const handleOwOCommands = async (message) => {
	const myself = message.guild.members.me?.nickname || client.user.displayName;

	if (message.content.includes(`**====== ${myself}'s Inventory ======**`)) {
		logInfo("Parsing inventory...");
		parseInventory(message.content);
	}

	if (message.author.id === "408785106942164992") {
		if (message.cleanContent.includes(`**🌱 | ${myself}**, hunt`)) {
			await processHuntAndBattle(message);
		} else if (
			message.components.length &&
			message.components[0].components[0].label === "Verify"
		) {
			spam = false;
			restartProcess();
		}
	}
};

// Inventory Parsing
const parseInventory = (inventoryContent) => {
	const regexInventory =
		/`(\d+)`(<:|<a:)(cgem|ugem|rgem|egem|lgem|fgem)(\d+):\d+>(\W{2})/g;
	let result;
	while ((result = regexInventory.exec(inventoryContent)) !== null) {
		const id = parseInt(result[1]);
		const rarityKey = result[3].charAt(0); // Extract the first letter (c, u, r, e, l, f)
		const typeKey = `gem${result[4]}`; // Extract the gem type (gem1, gem3, gem4)
		const amount = parseInt(convertSuperscriptToNumber(result[5]));

		gemItems.push({
			id,
			type: gemTypeNames[typeKey] || typeKey,
			rarity: gemRarityNames[rarityKey] || rarityKey,
			amount,
		});
	}

	logSuccess("Inventory parsed successfully.");
	console.table(gemItems, ["id", "type", "rarity", "amount"]);
};

// Processing Hunt and Battle
const processHuntAndBattle = async (message) => {
	logDivider("HUNT AND BATTLE");
	if (!gemItems.length) {
		activeChannel.sendTyping();
		await randomWait(1, 3);
		activeChannel.send("owo inv");
	}

	const gemAmounts = extractGemsLeft(message.content);
	logInfo("Gems Remaining:");
	console.table(gemAmounts);

	await handleMissingGems(gemAmounts);
	if (spam) await spamHuntAndBattle();
};

const extractGemsLeft = (content) => {
	const gemAmounts = { "Hunting Gem": 0, "Empowering Gem": 0, "Lucky Gem": 0 };
	const regexGems = /(gem1|gem3|gem4):\d+>`\[(\d+)/g;
	let result;
	while ((result = regexGems.exec(content)) !== null) {
		const typeName = gemTypeNames[result[1]] || result[1];
		gemAmounts[typeName] = parseInt(result[2]);
	}
	return gemAmounts;
};

const handleMissingGems = async (gemAmounts) => {
	for (const gemType in gemAmounts) {
		if (gemAmounts[gemType] === 0) {
			logWarning(`${gemType} has no remaining amount.`);

			const matchingGems = gemItems.filter(
				(gem) => gem.type === gemType && gem.amount > 0
			);

			if (matchingGems.length) {
				const highestIdGem = matchingGems.reduce((highest, current) =>
					current.id > highest.id ? current : highest
				);

				activeChannel.sendTyping();
				await randomWait(1, 3);
				activeChannel.send(`owo use ${highestIdGem.id}`);

				highestIdGem.amount -= 1;
				logSuccess(
					`Used ${highestIdGem.rarity} ${highestIdGem.type} (ID: ${highestIdGem.id}). Remaining: ${highestIdGem.amount}`
				);
			}
		}
	}
};

// Spamming Commands
const spamHuntAndBattle = async () => {
	logDivider("SPAMMING COMMANDS");
	await randomWait(15, 20);
	activeChannel.sendTyping();
	activeChannel.send("owo h");
	await randomWait(1, 3);
	activeChannel.sendTyping();
	activeChannel.send("owo b");
	logSuccess("Commands sent successfully.");

	if (!spam) logSuccess("Successfully stopped the spam.");
};

// Start Client
client.login(process.env.TOKEN);
