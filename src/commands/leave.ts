import Command from "@/lib/command";
import Mongo from "@/lib/mongo";
import { UserPartyQuery } from "@/types";

const mongo = Mongo.getInstance();

export default new Command(
  "leave",
  async ({ rawArgs, client, channel, tags }) => {
    const db = await mongo.db;

    const existingUser = await db
      .collection<UserPartyQuery>("users_party")
      .findOne({
        channelId: channel,
        twitchId: tags["user-id"],
      });

    if (!existingUser) {
      client.say(
        channel,
        `@${tags.username}, 🛑 você não está registrado na leadboard de jogadores.`
      );
      return;
    }

    db.collection<UserPartyQuery>("users_party").deleteOne({
      channelId: channel,
      twitchId: tags["user-id"],
    });

    client.say(
      channel,
      `@${tags.username}, 🛑 você saiu da leadboard do jogadores!.`
    );
  }
);
