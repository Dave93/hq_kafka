const fs = require("fs");
const path = require("path");
const { Kafka } = require("kafkajs");

(async () => {
  const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["rc1a-3fi4eoc4b41hrak4.mdb.yandexcloud.net:9091"],
    sasl: {
      mechanism: "scram-sha-512", // scram-sha-256 or scram-sha-512
      username: "chopar_davr",
      password: "mNw7@T8P`theQj#T",
    },
    ssl: {
      ca: [fs.readFileSync(path.join(__dirname + "/ca.crt"), "utf-8")],
    },
  });
  const consumer = kafka.consumer({ groupId: "hq" });

  await consumer.connect();
  await consumer.subscribe({ topic: "orders", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        value: message.value.toString(),
      });
    },
  });
})();
