import fs from "fs";
import crypto from "crypto";
import Mongo from "./mongo";

import {
  CacheEntry,
  DelayedGames,
  SteamMatchDetails,
  steamUserDetails,
} from "@/types";
import { Long } from "mongodb";
import retry from "retry";
import { logger } from "@/utils/logger";

const Steam = require("steam");
const Dota2 = require("dota2");
const mongo = Mongo.getInstance();

export default class Dota {
  private static instance: Dota;
  private cache: Map<number, CacheEntry> = new Map();
  private steamClient;
  private steamUser;
  public dota2;
  private interval: NodeJS.Timeout | undefined;

  private constructor() {
    this.steamClient = new Steam.SteamClient();
    this.steamUser = new Steam.SteamUser(this.steamClient);
    this.dota2 = new Dota2.Dota2Client(this.steamClient, false, false);
    this.dota2.setMaxListeners(12);

    const details = this.getUserDetails();

    this.loadServerList();
    this.loadSentry(details);

    this.setupClientEventHandlers(details);
    this.setupUserEventHandlers();
    this.setupDotaEventHandlers();

    this.steamClient.connect();
  }

  private async getGames() {
    // Check if the Dota2 game coordinator and Steam client are ready
    if (!this.isDota2Ready() || !this.isSteamClientLoggedOn()) return;

    const time = new Date();

    try {
      const games = await this.fetchGames();
      const uniqueGames = this.getUniqueGames(games, time);

      if (uniqueGames.length) {
        const db = await mongo.db;

        try {
          // Prepare bulk operations
          const bulkOps = uniqueGames.map((game: any) => ({
            updateOne: {
              filter: { "match.match_id": game.match_id },
              update: {
                $set: {
                  average_mmr: game.average_mmr,
                  players: game.players,
                  spectators: game.spectators,
                },
                $setOnInsert: {
                  "match.game_mode": game.game_mode,
                  "match.lobby_type": game.lobby_type,
                  "match.server_steam_id": game.server_steam_id,
                  createdAt: time,
                  "match.match_id": game.match_id,
                },
              },
              upsert: true,
            },
          }));

          // Perform bulk write
          await db.collection<DelayedGames>("delayedGames").bulkWrite(bulkOps);
        } catch (e) {
          logger.error("Error saving games:", e);
        } finally {
          //   await mongo.exit();
        }
      }
    } catch (error) {
      logger.error("Error fetching games:", error);
    }
  }

  // Filter unique games based on lobby_id
  private filterUniqueGames(games: SteamMatchDetails[]): SteamMatchDetails[] {
    return games.filter(
      (game, index, self) =>
        index === self.findIndex((g) => g.lobby_id.equals(game.lobby_id))
    );
  }

  // Fetch games from the Dota2 game coordinator
  private fetchGames(): Promise<SteamMatchDetails[]> {
    return new Promise((resolve, reject) => {
      if (!this.isDota2Ready() || !this.isSteamClientLoggedOn()) return;

      let games: SteamMatchDetails[] = [];
      const startGame = 90;

      // get a count of the match ids that are unique

      const callbackNotSpecificGames = (data: {
        specific_games: boolean;
        game_list: any[];
        league_id: number;
        start_game: number;
      }) => {
        games = games.concat(
          data?.game_list?.filter((game) => game.players?.length > 0)
        );
        // add match ids to unique set
        if (data?.league_id === 0 && startGame === data?.start_game) {
          this.dota2.removeListener(
            "sourceTVGamesData",
            callbackNotSpecificGames
          );
          resolve(this.filterUniqueGames(games));
        }
      };

      this.dota2.removeListener("sourceTVGamesData", callbackNotSpecificGames);
      this.dota2.on("sourceTVGamesData", callbackNotSpecificGames);

      for (let start = 0; start < 100; start += 10) {
        setTimeout(() => {
          try {
            this.dota2.requestSourceTVGames({ start_game: start });
          } catch (error) {
            logger.error("Error in Dota2Client.requestSourceTVGames:", error);
          }
        }, 50 * start);
      }
    });
  }

  // Get unique games and map them to the required structure
  private getUniqueGames(games: SteamMatchDetails[], time: Date) {
    return games
      .map((match) => ({
        match_id: new Long(match.match_id.low, match.match_id.high).toString(),
        players:
          // Removing underscores to save to db, so its in the same format as steam web api delayed games
          match.players?.map((player) => ({
            accountid: player.account_id,
            heroid: player.hero_id,
          })) || [],
        server_steam_id: new Long(
          match.server_steam_id.low,
          match.server_steam_id.high
        ).toString(),
        game_mode: match.game_mode,
        spectators: match.spectators,
        lobby_type: match.lobby_type,
        average_mmr: match.average_mmr,
        createdAt: time,
      }))
      .filter(
        (match, index, self) =>
          index ===
          self.findIndex((tempMatch) => tempMatch.match_id === match.match_id)
      );
  }

  public static getInstance(): Dota {
    if (!Dota.instance) {
      Dota.instance = new Dota();
    }
    return Dota.instance;
  }

  loadServerList() {
    const serverPath = "./src/volumes/servers.json";
    if (fs.existsSync(serverPath)) {
      try {
        Steam.servers = JSON.parse(fs.readFileSync(serverPath).toString());
      } catch (e) {
        console.log("Error loading server list", e);
        // Ignore
      }
    }
  }

  loadSentry(details: steamUserDetails) {
    const sentryPath = "./src/volumes/sentry";
    if (fs.existsSync(sentryPath)) {
      const sentry = fs.readFileSync(sentryPath);
      if (sentry.length) details.sha_sentryfile = sentry;
    }
  }

  // Check if the Dota2 game coordinator is ready
  private isDota2Ready(): boolean {
    return this.dota2._gcReady;
  }

  // Check if the Steam client is logged on
  private isSteamClientLoggedOn(): boolean {
    return this.steamClient.loggedOn;
  }

  private checkAccounts = async () => {
    if (!this.isDota2Ready() || !this.isSteamClientLoggedOn()) return;
    this.getGames();

    if (!this.interval) {
      // Get latest games every 30 seconds
      this.interval = setInterval(this.checkAccounts, 30_000);
    }
  };

  setupDotaEventHandlers() {
    this.dota2.on("hellotimeout", this.handleHelloTimeout.bind(this));
    this.dota2.on("unready", () =>
      logger.info("[STEAM] disconnected from dota game coordinator")
    );
    // Right when we start, check for accounts
    // This will run every 30 seconds otherwise
    this.dota2.on("ready", this.checkAccounts.bind(this));
  }

  setupUserEventHandlers() {
    this.steamUser.on("updateMachineAuth", this.handleMachineAuth.bind(this));
  }
  setupClientEventHandlers(details: steamUserDetails) {
    this.steamClient.on("connected", () => {
      this.steamUser.logOn(details);
    });
    this.steamClient.on("logOnResponse", this.handleLogOnResponse.bind(this));
    this.steamClient.on("loggedOff", this.handleLoggedOff.bind(this));
    this.steamClient.on("error", this.handleClientError.bind(this));
    this.steamClient.on("servers", this.handleServerUpdate.bind(this));
  }

  handleLogOnResponse(logonResp: any) {
    if (logonResp.eresult === Steam.EResult.OK) {
      logger.info("[STEAM] Logged on.");
      this.dota2.launch();
    } else {
      this.logSteamError(logonResp.eresult);
    }
  }

  handleLoggedOff(eresult: any) {
    if (this.isProduction()) this.steamClient.connect();
    logger.info("[STEAM] Logged off from Steam.", { eresult });
    this.logSteamError(eresult);
  }

  handleClientError(error: any) {
    logger.info("[STEAM] steam error", { error });
    if (!this.isProduction()) {
      this.exit().catch((e) => logger.error("err steam error", { e }));
    }

    if (this.isProduction()) this.steamClient.connect();
  }

  handleServerUpdate(servers: any) {
    fs.writeFileSync("./src/volumes/servers.json", JSON.stringify(servers));
  }

  handleMachineAuth(sentry: any, callback: any) {
    const hashedSentry = crypto
      .createHash("sha1")
      .update(sentry.bytes)
      .digest();
    fs.writeFileSync("./src/volumes/sentry", hashedSentry);
    logger.info("[STEAM] sentryfile saved");
    callback({ sha_file: hashedSentry });
  }

  handleHelloTimeout() {
    this.dota2.exit();
    setTimeout(() => {
      if (this.isSteamClientLoggedOn()) this.dota2.launch();
    }, 30000);
    logger.info("[STEAM] hello time out!");
  }

  logSteamError(eresult: any) {
    try {
      // @ts-expect-error no types exist
      steamErrors(eresult, (err, errorObject) => {
        logger.info("[STEAM]", { errorObject, err });
      });
    } catch (e) {
      // Ignore
    }
  }

  isProduction() {
    return process.env.DOTABOD_ENV === "production";
  }

  public getUserSteamServer = (steam32Id: number | string): Promise<string> => {
    const steam_id = this.dota2.ToSteamID(Number(steam32Id));

    // Set up the retry operation
    const operation = retry.operation({
      retries: 35,
      factor: 1.1,
      minTimeout: 5000, // Minimum retry timeout (1 second)
      maxTimeout: 10_000, // Maximum retry timeout (10 seconds)
    });

    return new Promise((resolve, reject) => {
      operation.attempt(() => {
        this.dota2.spectateFriendGame(
          { steam_id },
          (response: any, err: any) => {
            const theID = response?.server_steamid?.toString();

            const shouldRetry = !theID
              ? new Error("No ID yet, will keep trying.")
              : undefined;
            if (operation.retry(shouldRetry)) return;

            if (theID) resolve(theID);
            else reject("No spectator match found");
          }
        );
      });
    });
  };

  getUserDetails() {
    const usernames = process.env.STEAM_USER?.split("|") ?? [];
    const passwords = process.env.STEAM_PASS?.split("|") ?? [];
    if (!usernames.length || !passwords.length) {
      throw new Error("STEAM_USER or STEAM_PASS not set");
    }

    return {
      account_name: usernames[0],
      password: passwords[0],
    };
  }

  public exit(): Promise<boolean> {
    return new Promise((resolve) => {
      clearInterval(this.interval);
      this.dota2.exit();
      logger.info("[STEAM] Manually closed dota");
      this.steamClient.disconnect();
      logger.info("[STEAM] Manually closed steam");
      this.steamClient.removeAllListeners();
      this.dota2.removeAllListeners();
      logger.info("[STEAM] Removed all listeners from dota and steam");
      resolve(true);
    });
  }
}
