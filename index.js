import { Client } from "discord.js-selfbot-v13";
import readline from "readline";
import chalk from "chalk";
import dotenv from "dotenv";
dotenv.config();

const client = new Client();

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomWait(minSeconds, maxSeconds) {
	const minMs = minSeconds * 1000;
	const maxMs = maxSeconds * 1000;
	return wait(Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs);
}

function convertSuperscriptToNumber(superscriptString) {
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
}

let spam = false;
let channel;
const gemItems = [];

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

rl.on("line", (input) => {
	const command = input.trim();
	switch (command) {
		case "owo hh":
			spam = true;
			console.log(chalk.green("[COMMAND]: Spam started."));
			if (!channel)
				console.log(
					chalk.yellow(
						"[WARNING]: Please specify a channel by typing in a Discord channel first."
					)
				);
			break;
		case "owo bb":
			spam = false;
			console.log(chalk.red("[COMMAND]: Spam stopped."));
			break;
		default:
			console.log(
				chalk.red(
					"[ERROR]: Unknown command. Use 'owo hh' to start or 'owo bb' to stop."
				)
			);
	}
});

client.on("ready", () => {
	console.log(chalk.cyan(`\n[INFO]: Logged in as ${client.user.username}!\n`));
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
			console.log(chalk.blue(`\n[INFO]: Channel set to #${channel.name}.\n`));
		}
	}

	if (!channel) return;

	if (message.channel.id !== channel.id) return;

	const myself = message.guild.members.me?.nickname || client.user.displayName;

	if (message.content.includes(`**====== ${myself}'s Inventory ======**`)) {
		console.log(chalk.cyan("[INFO]: Parsing inventory...\n"));
		const inventory = message.content;
		const regexInventory =
			/`(\d+)`(<:|<a:)(cgem|ugem|rgem|egem|lgem|fgem)(\d+):\d+>(\W{2})/g;
		let result;

		while ((result = regexInventory.exec(inventory)) !== null) {
			const id = parseInt(result[1]);
			const name = `${result[3]}${result[4]}`;
			const amount = parseInt(convertSuperscriptToNumber(result[5]));
			gemItems.push({ id, name, amount });
		}
		console.log(chalk.green("[INVENTORY]:"), gemItems);
	}

	if (
		message.channel.id === channel.id &&
		message.author.id === "408785106942164992" &&
		message.cleanContent.includes(`**🌱 | ${myself}**, hunt`)
	) {
		console.log(chalk.cyan("[INFO]: Processing gems and handling hunt..."));

		if (!gemItems.length) {
			channel.sendTyping();
			channel.send("owo inv");
		}

		const gemsString = message.content;
		const gemsLeft = [];
		const regexGems = /(gem1|gem3|gem4):\d+>`\[(\d+)/g;
		let result;

		while ((result = regexGems.exec(gemsString)) !== null) {
			const gemType = result[1];
			const currentAmount = parseInt(result[2]);
			gemsLeft.push({ gemType, currentAmount });
		}

		console.log(chalk.yellow("[GEMS LEFT]:"), gemsLeft);

		gemsLeft.forEach((gem) => {
			if (gem.currentAmount === 0) {
				console.log(
					chalk.yellow(`[INFO]: ${gem.gemType} has no remaining amount.`)
				);
				const matchingGems = gemItems.filter(
					(g) => g.name.includes(gem.gemType) && g.amount > 0
				);

				if (matchingGems.length) {
					const highestIdGem = matchingGems.reduce((highest, current) =>
						parseInt(current.id, 10) > parseInt(highest.id, 10)
							? current
							: highest
					);

					channel.sendTyping();
					channel.send(`owo use ${highestIdGem.id}`);
					highestIdGem.amount = Math.max(0, highestIdGem.amount - 1);
					console.log(
						chalk.green(
							`[ACTION]: Used gem ID ${highestIdGem.id}. Remaining amount: ${highestIdGem.amount}`
						)
					);
				}
			}
		});

		if (spam) {
			console.log(chalk.blue("[SPAM]: Sending hunt and battle commands..."));
			await randomWait(15, 20);
			channel.sendTyping();
			channel.send("owo h");
			await randomWait(1, 3);
			channel.sendTyping();
			channel.send("owo b");
			console.log(chalk.green("[SPAM]: Sent..."));
		}
	} else if (
		message.channel.id === channel.id &&
		message.author.id === "408785106942164992" &&
		message.content.includes(
			`**⚠️ |** <@${client.user.id}>, ar​e y​ou a​ re​al human​?`
		)
	) {
		console.log(chalk.redBright("[Error]: Verification Needed!"));
	}
});

client.login(process.env.TOKEN);
