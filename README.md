<img width="120" height="120" align="left" style="float: left; margin: 0 10px 0 0;" alt="cruncy cat" src="https://i.pinimg.com/736x/20/c5/08/20c508cc4173e9e179d99d15b4ba74ed.jpg">

# OwObot Selfbot Farming Script

A friendly OwObot farming script. Written in Javascript using NodeJS and discord.js.

## ❤️ About

owo-bot-farm-selfbot is a Discord self-bot script to farm OwOBot's "owo hunt" and "owo battle" commands. It is built using discord.js-selfbot-v13 package for the utilization of the Discord API interaction.

## 📷 Screenshot
![console](https://raw.githubusercontent.com/MiraBellierr/owo-bot-farm-selfbot/refs/heads/main/assets/1734133655713.png)

## 🧡 Features

- 🌟 **Switch on/off**: Can be switch on and off at anytime in the terminal or in Discord chat.
- 🛠 **Auto Assign Farm Channel**: Just send a first message in a channel you want to farm after running a script.
- 📋 **Auto Equip Gems**: Automatically equip any gem that has expired.
- 📞 **Stop when Captcha Appear**: It will stop when the human verification message appear.
- 🔒 **Pretty Console**: It will send just enough information in the terminal.

## 🔧 How to Use

1. Run the script.
2. type and send "start" in the terminal.
3. type a message in any channel you want to farm OwObot with.
4. type and send "owo hunt" in that channel.
5. The script will help you do "owo hunt" and owo battle" after that.

**NOTE**: Make sure to monitor and remain in the chat while running the script because the verification may appear at any time. Failed to respond in **10 minutes** will result in a ban!

## ⚙ Commands

### start

**start** (console command): Start the script.
**owo hh** (in-chat command): Type this in the Discord channel. It will reassign the channel with the current channel and start the script.

### stop

**stop** (console command): Stop the script
**owo bb** (in-chat command): Type this in the Discord channel. It will stop the script.

## 🛠 Installation

### Prerequisites

- **Node.js** (version 14+ recommended)
- **Git**

### Steps to Install

1. Clone the repository:

   ```bash
   git clone https://github.com/MiraBellierr/owo-bot-farm-selfbot.git
   cd owo-bot-farm-selfbot
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure the environment:
   Create a `.env` file in the project root and add the following:
   `env
TOKEN=Your-Discord-Token
`

## 🚀 Running the script

1. Start the script with:
   ```bash
   node .
   ```

## 💛 Contributing

We welcome contributions to owo-bot-farm-selfbot! If you'd like to help:

1. Fork the repository.
2. Create a branch for your feature or fix.
3. Submit a pull request, and we’ll review it!

## 📚 Assets and Tools

- **[Node.js](https://nodejs.org/)**: JavaScript runtime
