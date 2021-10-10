const fs = require("fs");
const path = require("path");
const { Kafka, CompressionTypes } = require("kafkajs");

(async () => {
    const kafka = new Kafka({
        // clientId: "my-app",
        brokers: ["localhost:29092"],
        // sasl: {
        //     mechanism: "scram-sha-512", // scram-sha-256 or scram-sha-512
        //     username: "chopar_davr", // producer
        //     password: "mNw7@T8P`theQj#T", // producer
        //     // username: "hq_consumer", // consumer
        //     // password: 'C_22!%tt77YS*A&y', // consumer
        // },
        // ssl: {
        //     ca: [fs.readFileSync(path.join(__dirname + "/ca.crt"), "utf-8")],
        // },
    });
    const producer = kafka.producer();

    await producer.connect();
    producer
        .send({
            topic: 'hq',
            compression: CompressionTypes.GZIP,
            messages: [{
                key:'davr',
                value: 'keldi'
            }],
        })
        .then(console.log)
        .catch(e => console.error(`[example/producer] ${e.message}`, e))
})();
