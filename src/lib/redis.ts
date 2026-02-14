import { createClient, RedisClientType } from "redis";

export default class Redis {
  private static instance: Redis;
  private client: RedisClientType;

  private constructor() {
    const redisData = {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
    };
    const redisUrl = `redis://default:${redisData.password}@${redisData.host}:${redisData.port}`;
    this.client = createClient({
      url: redisUrl,
    });

    this.client.on("error", (err) => console.log("Redis Client Error", err));
    this.client.connect();
  }

  public static getInstance(): Redis {
    if (!Redis.instance) {
      Redis.instance = new Redis();
    }
    return Redis.instance;
  }

  public getClient(): RedisClientType {
    return this.client;
  }
}
