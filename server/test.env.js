const NodeEnv = require("jest-environment-node");

const { MongoMemoryServer } = require("mongodb-memory-server");

const { RedisMemoryServer } = require("redis-memory-server");

class Env extends NodeEnv {
  constructor(config) {
    super(config);

    this.mongod = new MongoMemoryServer({
      binary: {
        checkMD5: false,
      },
      instance: {
        dbName: "test",
      },
    });

    this.redis = new RedisMemoryServer({
      autoStart: false,
    });
  }

  async setup() {
    await super.setup();

    await this.mongod.start();

    await this.redis.start();

    this.global.CONFIG__LOG_LEVEL = "debug";

    this.global.CONFIG__MONGO_URL = this.mongod.getUri();
    this.global.CONFIG__MONGO_DB = "test";

    this.global.CONFIG__ALLOWED_JOBS = "mail,test";

    const redisUrl = `redis://${await this.redis.getHost()}:${await this.redis.getPort()}`;

    this.global.CONFIG__JOB_CONFIGURATION = JSON.stringify({
      mail: { redisURL: redisUrl },
      test: { redisURL: redisUrl },
    });
  }

  async teardown() {
    await this.mongod.stop();
    await this.redis.stop();

    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}

module.exports = Env;
