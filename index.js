import { Client } from "discord.js-selfbot-v13";
import readline from "readline";
import chalk from "chalk";
import dotenv from "dotenv";
import player from "play-sound";

dotenv.config();

const args = process.argv.slice(2);
const client = new Client();
let playSound = args.includes("--sound=true");

const gemItems = [];
let spam = false;
let channel = null;

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const randomWait = (minSeconds, maxSeconds) => {
	const minMs = minSeconds * 1000;
	const maxMs = maxSeconds * 1000;
	return wait(Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs);
};

const convertSuperscriptToNumber = (superscriptString) => {
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
	return superscriptString
		.split("")
		.map((char) => superscriptMap[char] || char)
		.join("");
};

const playSoundEffect = (file) => {
	if (playSound) {
		player().play(file, (err) => {
			if (err) console.error(err);
		});
	}
};

rl.on("line", (input) => {
	const command = input.trim().toLowerCase();
	switch (command) {
		case "start":
			spam = true;
			console.log(chalk.green("[COMMAND]: Spam started."));
			if (!channel) {
				console.log(
					chalk.yellow(
						"[WARNING]: Please specify a channel by typing in a Discord channel first."
					)
				);
			}
			break;
		case "stop":
			spam = false;
			console.log(chalk.red("[COMMAND]: Spam stopped."));
			break;
		default:
			console.log(
				chalk.red("[ERROR]: Unknown command. Use 'start' or 'stop'.")
			);
	}
});

client.on("ready", () => {
	console.log(chalk.cyan(`\n[INFO]: Logged in as ${client.user.username}!`));
});

client.on("messageCreate", async (message) => {
	if (message.channel.type === "DM") return;

	if (message.author.id === client.user.id) {
		if (message.content === "owo hh") {
			channel = message.channel;
			spam = true;
			console.log(chalk.green("[ACTION]: Channel set and spam started."));
		} else if (message.content === "owo bb") {
			spam = false;
			console.log(chalk.red("[ACTION]: Spam stopped."));
		}
		if (!channel) {
			channel = message.channel;
			console.log(chalk.blue(`[INFO]: Channel set to #${channel.name}.`));
		}
	}

	if (!channel || message.channel.id !== channel.id) return;

	const myself = message.guild.members.me?.nickname || client.user.displayName;

	if (message.content.includes(`**====== ${myself}'s Inventory ======**`)) {
		console.log(chalk.cyan("[INFO]: Parsing inventory..."));
		parseInventory(message.content);
	}

	if (
		message.author.id === "408785106942164992" &&
		message.cleanContent.includes(`**🌱 | ${myself}**, hunt`)
	) {
		await processHuntAndBattle(message);
	} else if (
		message.author.id === "408785106942164992" &&
		message.content.includes(
			`**⚠️ |** <@${client.user.id}>, ar​e y​ou a​ re​al human​?`
		)
	) {
		playSoundEffect("./assets/157795.mp3");
		console.log(chalk.redBright("[Error]: Verification Needed!"));
	}
});

const parseInventory = (inventoryContent) => {
	const regexInventory =
		/`(\d+)`(<:|<a:)(cgem|ugem|rgem|egem|lgem|fgem)(\d+):\d+>(\W{2})/g;
	let result;
	while ((result = regexInventory.exec(inventoryContent)) !== null) {
		const id = parseInt(result[1]);
		const name = `${result[3]}${result[4]}`;
		const amount = parseInt(convertSuperscriptToNumber(result[5]));
		gemItems.push({ id, name, amount });
	}
	console.log(chalk.green("[INVENTORY]:"), gemItems);
};

const processHuntAndBattle = async (message) => {
	console.log(chalk.cyan("[INFO]: Processing gems and handling hunt..."));
	if (!gemItems.length) {
		channel.sendTyping();
		await randomWait(1, 3);
		channel.send("owo inv");
	}

	const gemAmounts = extractGemsLeft(message.content);
	console.log(chalk.yellow("[GEMS LEFT]:"), gemAmounts);

	await handleMissingGems(gemAmounts);
	if (spam) {
		await spamHuntAndBattle();
	}
};

const extractGemsLeft = (content) => {
	const gemAmounts = { gem1: 0, gem3: 0, gem4: 0 };
	const regexGems = /(gem1|gem3|gem4):\d+>`\[(\d+)/g;
	let result;
	while ((result = regexGems.exec(content)) !== null) {
		gemAmounts[result[1]] = parseInt(result[2]);
	}
	return gemAmounts;
};

const handleMissingGems = async (gemAmounts) => {
	for (const gemType in gemAmounts) {
		if (gemAmounts[gemType] === 0) {
			console.log(chalk.yellow(`[INFO]: ${gemType} has no remaining amount.`));

			// Find all matching gems of the current type that have a positive amount
			const matchingGems = gemItems.filter(
				(g) => g.name.includes(gemType) && g.amount > 0
			);

			if (matchingGems.length) {
				// Find the gem with the highest ID from the matching gems
				const highestIdGem = matchingGems.reduce((highest, current) =>
					current.id > highest.id ? current : highest
				);

				channel.sendTyping();
				await randomWait(1, 3);
				channel.send(`owo use ${highestIdGem.id}`);

				// Decrease the amount of the gem used
				highestIdGem.amount -= 1;
				console.log(
					chalk.green(
						`[ACTION]: Used gem ID ${highestIdGem.id}. Remaining amount: ${highestIdGem.amount}`
					)
				);
			}
		}
	}
};

const spamHuntAndBattle = async () => {
	console.log(chalk.blue("[SPAM]: Sending hunt and battle commands..."));
	await randomWait(15, 20);
	channel.sendTyping();
	channel.send("owo h");
	await randomWait(1, 3);
	channel.sendTyping();
	channel.send("owo b");
	console.log(chalk.green("[SPAM]: Sent..."));
	playSoundEffect("./assets/236676.mp3");
};

client.login(process.env.TOKEN);
