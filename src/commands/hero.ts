import { HeroNames } from "../types";
import Command from "../lib/command";
import { D2PtScraper } from "d2pt.js";
import RedisManager from "../utils/redis-manager";
import { heroesAliasses } from "../constants";

const d2pt = new D2PtScraper();
const redisManager = new RedisManager();

function isHeroName(name: string): string | null {
  const normalizedName = name.toLowerCase();
  for (const [hero, aliases] of Object.entries(heroesAliasses)) {
    if (aliases.includes(normalizedName)) {
      return hero ?? null;
    }
  }
  return null;
}

export default new Command(
  "hero",
  async ({ rawArgs, client, channel, tags }) => {
    const args = rawArgs.split(" ");
    const heroName: HeroNames = args[0].toLocaleLowerCase() as HeroNames;
    let response = "";
    let heroinfo = null;
    const heroMatch = isHeroName(heroName);

    if (heroMatch) {
      const heroSelected = Object.keys(HeroNames).find(
        (hero) => hero.toLowerCase() === heroMatch.toLocaleLowerCase()
      );
      const heroValue = heroSelected
        ? HeroNames[heroSelected as keyof typeof HeroNames]
        : null;
      const getHeroInfoCache = await redisManager.get(heroSelected ?? "");
      if (!getHeroInfoCache) {
        const heroInfoData = await d2pt.getHeroInfo(heroValue as HeroNames);
        heroinfo = heroInfoData
          ?.filter((hero) => hero.mostPlayed)
          .map((hero) => ({
            role: hero.role,
            matches: hero.matches,
            winRate: hero.winRate,
          }))[0];
        if (!heroinfo) {
          client.say(
            channel,
            `@${
              tags.username
            }, No data found for ${heroName.toUpperCase()}, please try again later`
          );
          return;
        }
        await redisManager.set(heroSelected ?? "", JSON.stringify(heroinfo));
      } else {
        heroinfo = JSON.parse(getHeroInfoCache);
      }

      response = ``;
      response += `⭐ ${heroName.toUpperCase()} - ${
        heroinfo?.role
      } | Win Rate: ${heroinfo?.winRate} | Matches: ${heroinfo?.matches}`;
    } else {
      response = "Hero name not found!";
    }

    client.say(channel, `@${tags.username}, ${response}`);
  }
);
