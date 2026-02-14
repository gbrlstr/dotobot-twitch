import { Long } from "mongodb";
import TwitchBot from "../lib/twitch";
import { ChatUserstate } from "tmi.js";

export interface ChannelsQuery {
  id: number;
  count?: number;
  accounts: number[];
  delay?: {
    enabled: boolean;
    seconds?: number;
  };
  mods?: number[];
  name: string;
  globalMod?: boolean;
  self?: boolean;
  hc?: { hero_id: string }[];
  emotes?: boolean;
}
export interface PlayersQuery {
  account_id: number;
  hero_id: number;
}
export interface GamesQuery {
  average_mmr: number;
  activate_time: number;
  deactivate_time: number;
  game_mode: number;
  league_id: number;
  match_id: Long;
  lobby_id: Long;
  lobby_type: number;
  players: PlayersQuery[];
  server_steam_id: Long;
  weekend_tourney_bracket_round: number | null;
  weekend_tourney_skill_level: number | null;
  createdAt: Date;
}
export interface GameHistoryQuery {
  average_mmr: number;
  game_mode: number;
  league_id: number;
  match_id: Long;
  lobby_id: Long;
  lobby_type: number;
  players: PlayersQuery[];
  server_steam_id: Long;
  weekend_tourney_bracket_round: number | null;
  weekend_tourney_skill_level: number | null;
  createdAt: Date;
  radiant_win?: boolean;
}
export interface RpsQuery {
  status: string;
  WatchableGameID: Long | null;
  watching_server: Long | null;
  steam_id: Long;
  createdAt: Date;
  param0: string | null;
}
export interface CommandsQuery {
  triggers: string[];
  filename: string;
  command: string;
  channels: number[];
  cooldown: number;
}
export interface HeroesQuery {
  id: number;
  localized_name: string;
  custom?: boolean;
  emotes?: number[];
  emotesets: string[];
}
export interface NotablePlayersQuery {
  id: number;
  channel: number | null;
  name: string;
  enabled: boolean;
  lastChangedBy: number | null;
  lastChanged?: Date;
}
export interface GameModesQuery {
  id: number;
  name: string;
}
export interface CardsQuery {
  id: number;
  lobby_id: Long;
  createdAt: Date;
  leaderboard_rank: number;
  rank_tier: number;
  lifetime_games: number;
}
export interface ErrorsQuery {
  message: string;
  name: string;
  stack: string | undefined;
  createdAt: Date;
}
export interface MedalsQuery {
  rank_tier: number;
  name: string;
}
export interface StreamsQuery {
  user_id: number;
  startTime: Date;
  createdAt: Date;
}
export interface RealTimeStatsPlayersQuery {
  accountid: number;
  playerid: number;
  team: number;
  heroid: number;
}
export interface RealTimeStatsTeamsQuery {
  team_number: number;
  players: RealTimeStatsPlayersQuery[];
}
export interface RealTimeStatsQuery {
  server_steam_id: Long;
  buildings: [];
  createdAt: Date;
  graph_data: {};
  match: {};
  teams: RealTimeStatsTeamsQuery[];
}

export type RunParams = {
  client: TwitchBot;
  commandName: string;
  args: string[];
  rawArgs: string;

  channel: string;
  tags: ChatUserstate;
  message: string;
  self: boolean;
};

export type Hero = {
  role?: string;
  name?: string;
  matches?: string;
  winRate?: string;
  winRate9500?: string;
  contestRate?: string;
  rating?: string;
  radiantWinRate?: string;
  direWinRate?: string;
  expertWinRate?: string;
  phase1WinRate?: string;
  phase2WinRate?: string;
  phase3WinRate?: string;
  networth?: string;
};

export type MetaHeroes = {
  All: Hero[];
  Carry: Hero[];
  Mid: Hero[];
  Off: Hero[];
  sup4: Hero[];
  sup5: Hero[];
  pos4: Hero[];
  pos5: Hero[];
};

export interface UserPartyQuery {
  channelId: string;
  dotaId: number;
  twitchId: string;
}

export enum HeroNames {
  AntiMage = "Anti-Mage",
  Axe = "Axe",
  Bane = "Bane",
  Bloodseeker = "Bloodseeker",
  CrystalMaiden = "Crystal Maiden",
  DrowRanger = "Drow Ranger",
  Earthshaker = "Earthshaker",
  Juggernaut = "Juggernaut",
  Mirana = "Mirana",
  Morphling = "Morphling",
  ShadowFiend = "Shadow Fiend",
  PhantomLancer = "Phantom Lancer",
  Puck = "Puck",
  Pudge = "Pudge",
  Razor = "Razor",
  SandKing = "Sand King",
  StormSpirit = "Storm Spirit",
  Sven = "Sven",
  Tiny = "Tiny",
  VengefulSpirit = "Vengeful Spirit",
  Windranger = "Windranger",
  Zeus = "Zeus",
  Kunkka = "Kunkka",
  Lina = "Lina",
  Lion = "Lion",
  ShadowShaman = "Shadow Shaman",
  Slardar = "Slardar",
  Tidehunter = "Tidehunter",
  WitchDoctor = "Witch Doctor",
  Lich = "Lich",
  Riki = "Riki",
  Enigma = "Enigma",
  Tinker = "Tinker",
  Sniper = "Sniper",
  Necrophos = "Necrophos",
  Warlock = "Warlock",
  Beastmaster = "Beastmaster",
  QueenOfPain = "Queen of Pain",
  Venomancer = "Venomancer",
  FacelessVoid = "Faceless Void",
  WraithKing = "Wraith King",
  DeathProphet = "Death Prophet",
  PhantomAssassin = "Phantom Assassin",
  Pugna = "Pugna",
  TemplarAssassin = "Templar Assassin",
  Viper = "Viper",
  Luna = "Luna",
  DragonKnight = "Dragon Knight",
  Dazzle = "Dazzle",
  Clockwerk = "Clockwerk",
  Leshrac = "Leshrac",
  NaturesProphet = "Nature's Prophet",
  Lifestealer = "Lifestealer",
  DarkSeer = "Dark Seer",
  Clinkz = "Clinkz",
  Omniknight = "Omniknight",
  Enchantress = "Enchantress",
  Huskar = "Huskar",
  NightStalker = "Night Stalker",
  Broodmother = "Broodmother",
  BountyHunter = "Bounty Hunter",
  Weaver = "Weaver",
  Jakiro = "Jakiro",
  Batrider = "Batrider",
  Chen = "Chen",
  Spectre = "Spectre",
  AncientApparition = "Ancient Apparition",
  Doom = "Doom",
  Ursa = "Ursa",
  SpiritBreaker = "Spirit Breaker",
  Gyrocopter = "Gyrocopter",
  Alchemist = "Alchemist",
  Invoker = "Invoker",
  Silencer = "Silencer",
  OutworldDestroyer = "Outworld Destroyer",
  Lycan = "Lycan",
  Brewmaster = "Brewmaster",
  ShadowDemon = "Shadow Demon",
  LoneDruid = "Lone Druid",
  ChaosKnight = "Chaos Knight",
  Meepo = "Meepo",
  TreantProtector = "Treant Protector",
  OgreMagi = "Ogre Magi",
  Undying = "Undying",
  Rubick = "Rubick",
  Disruptor = "Disruptor",
  NyxAssassin = "Nyx Assassin",
  NagaSiren = "Naga Siren",
  KeeperOfTheLight = "Keeper of the Light",
  Io = "Io",
  Visage = "Visage",
  Slark = "Slark",
  Medusa = "Medusa",
  TrollWarlord = "Troll Warlord",
  CentaurWarrunner = "Centaur Warrunner",
  Magnus = "Magnus",
  Timbersaw = "Timbersaw",
  Bristleback = "Bristleback",
  Tusk = "Tusk",
  SkywrathMage = "Skywrath Mage",
  Abaddon = "Abaddon",
  ElderTitan = "Elder Titan",
  LegionCommander = "Legion Commander",
  Techies = "Techies",
  EmberSpirit = "Ember Spirit",
  EarthSpirit = "Earth Spirit",
  Underlord = "Underlord",
  Terrorblade = "Terrorblade",
  Phoenix = "Phoenix",
  Oracle = "Oracle",
  WinterWyvern = "Winter Wyvern",
  ArcWarden = "Arc Warden",
  MonkeyKing = "Monkey King",
  DarkWillow = "Dark Willow",
  Pangolier = "Pangolier",
  Grimstroke = "Grimstroke",
  Hoodwink = "Hoodwink",
  VoidSpirit = "Void Spirit",
  Snapfire = "Snapfire",
  Mars = "Mars",
  Dawnbreaker = "Dawnbreaker",
  Marci = "Marci",
  PrimalBeast = "Primal Beast",
  Muerta = "Muerta",
}

export type HeroNamesType = keyof typeof HeroNames;

export interface SteamMatchDetails {
  activate_time: number;
  deactivate_time: number;
  server_steam_id: Long;
  lobby_id: Long;
  league_id: number;
  lobby_type: number;
  game_time: number;
  delay: number;
  spectators: number;
  game_mode: number;
  average_mmr: number;
  match_id: Long;
  series_id: number;
  team_name_radiant: string | null;
  team_name_dire: string | null;
  sort_score: number;
  last_update_time: number;
  radiant_lead: number;
  radiant_score: number;
  dire_score: number;
  players: {
    account_id: number;
    hero_id: number;
  }[];
  building_state: number;
  custom_game_difficulty: number;
}

export type steamUserDetails = {
  account_name: string;
  password: string;
  sha_sentryfile?: Buffer;
};

export interface Cards {
  lifetime_games: number;
  account_id: number;
  leaderboard_rank: number;
  rank_tier: number;
  createdAt: Date;
}

export interface CacheEntry {
  timestamp: number;
  card: Cards;
}

export interface DelayedGames {
  _id: string;
  match: {
    server_steam_id: string;
    match_id: string;
    game_mode: number;
    lobby_type: number;
  };
  teams: {
    players: {
      items: number[];
      heroid: number;
      accountid: string;
      team_slot: number;
    }[];
    average_mmr?: number;
    spectators?: number;
  }[];
}
