import { Client as TmiClient } from "tmi.js";
import { PREFIX } from "../constants";
import TwitchAPI from "../utils/twitchApi";
import * as commandFiles from "../commands";
import Command from "./command";
import env from "../env";
import Mongo from "./mongo";

export default class TwitchBot extends TmiClient {
	private static instance: TwitchBot;

	commands: Record<string, Command["execute"]> = {};

	constructor() {
		super({
			options: { debug: env.NODE_ENV === "development" },
			connection: {
				reconnect: true,
				secure: true,
			},
			identity: {
				username: env.BOT_NAME,
				password: env.BOT_PASS,
			},
			channels: ['dotobot_'],
		});
	}

	public async initialize(): Promise<void> {
		this.registerCommands();
		this.handleCommands();
		await this.registerChannels();
		this.connect();
	}

	public static getInstance(): TwitchBot {
		if (!TwitchBot.instance) {
			TwitchBot.instance = new TwitchBot();
		}
		return TwitchBot.instance;
	}

	private registerCommands() {
		Object.values(commandFiles).forEach(({ commandName, execute }) => {
			Object.assign(this.commands, {
				...this.commands,
				[commandName]: execute,
			});
		});
	}

	private handleCommands() {
		this.on("message", (channel, tags, message, self) => {
			if (self || !message.startsWith(PREFIX)) return;
			const args = message.slice(1).split(" ");
			const commandName = args.shift()?.toLowerCase();

			if (commandName && this.commands[commandName]) {
				this.commands[commandName]({
					client: this,
					commandName,
					args,
					rawArgs: args.join(" "),
					channel,
					tags,
					message,
					self,
				});
			}
		});
	}

	private async registerChannels() {
		try {
			const [channelsQuery] = await Promise.all([this.getChannelsQuery()]);
			const channels = this.getChannelsConnected(channelsQuery);
			channels.push("dotobot_");
			console.log("CHANNELS", channels);
			// channelsQuery.unshift("dotobot_");
			this.getOptions().channels = channels;
		} catch (error) {
			console.error("Error initializing TwitchBot:", error);
		}
	}
	private async getChannelsQuery(): Promise<any[]> {
		const db = await Mongo.getInstance().db;
		return db
			.collection("channels")
			.find({ name: { $exists: true } })
			.sort({ count: -1 })
			.toArray();
	}

	private getChannelsConnected(channelsQuery: any[]): string[] {
		const channelsSet = new Set<string>();
		channelsQuery.forEach((channel) => channelsSet.add(channel.name));
		return Array.from(channelsSet.values());
	}

	public sendMessage(channel: string, message: string) {
		this.say(channel, message).catch((error) => {
			console.error("Erro ao enviar mensagem:", error);
		});
	}

	public exit(): Promise<boolean> {
		return new Promise((resolve) => {
			this.disconnect()
				.then(() => console.log("Manually disconnected from twitch"))
				.then(() => {
					this.removeAllListeners();
					console.log("Removed all listeners from twitch");
					resolve(true);
				});
		});
	}
}
