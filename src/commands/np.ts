import Command from "@/lib/command";
import Dota from "@/lib/dota";
import Mongo from "@/lib/mongo";
import { DelayedGames } from "@/types";

const mongo = Mongo.getInstance();

export default new Command("np", async ({ rawArgs, client, channel, tags }) => {
  const db = await mongo.db;
  const match = await db.collection<DelayedGames>("delayedGames").findOne({
    players: {
      $elemMatch: {
        accountid: 127565532,
      },
    },
  });

  console.log("MATCH", match);
});
