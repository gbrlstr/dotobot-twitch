import { ErrorsQuery } from "./types";
import Mongo from "./lib/mongo";
import TwitchBot from "./lib/twitch";
import Dota from "./lib/dota";

const mongo = Mongo.getInstance();
const twitchBot = TwitchBot.getInstance();
const dotaBot = Dota.getInstance();

twitchBot.initialize();

process.on("uncaughtException", async (err) => {
  const db = await mongo.db;
  db.collection<ErrorsQuery>("errors")
    .insertOne({
      message: err.message,
      name: err.name,
      stack: err.stack,
      createdAt: new Date(),
    })
    .catch(() => {})
    .then(() => console.log(err));
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM");
  Promise.all([twitchBot.exit(), mongo.exit(), dotaBot.exit()]).then(() =>
    process.exit(0)
  );
});
