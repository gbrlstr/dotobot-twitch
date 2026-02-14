import Command from "@/lib/command";
import Mongo from "@/lib/mongo";
import { UserPartyQuery } from "@/types";

const mongo = Mongo.getInstance();

export default new Command(
  "register",
  async ({ rawArgs, client, channel, tags }) => {
    const dotaId = rawArgs.trim();

    if (dotaId?.length === 0) {
      client.say(
        channel,
        `@${tags.username},🛑 Por favor, forneça um ID válido. Ex: !register 123456789`
      );
      return;
    }

    if (Number.isNaN(Number(dotaId))) {
      client.say(
        channel,
        `@${tags.username},🛑 o dotaID informado não é um número válido, por favor, verifique e tente novamente. Ex: !register 123456789`
      );
      return;
    }

    const db = await mongo.db;

    const existingUser = await db
      .collection<UserPartyQuery>("users_party")
      .findOne({
        channelId: channel,
        twitchId: tags["user-id"],
      });

    if (existingUser) {
      client.say(
        channel,
        `@${tags.username},🛑 você já está registrado com o ID ${existingUser?.dotaId}.`
      );
      return;
    }

    db.collection<UserPartyQuery>("users_party").updateOne(
      { channelId: channel },
      {
        $set: {
          channelId: channel,
          dotaId: Number(dotaId),
          twitchId: tags["user-id"],
        },
      },
      { upsert: true }
    );

    client.say(
      channel,
      `@${tags.username},✅ O ID ${dotaId} foi registrado com sucesso.`
    );
  }
);
