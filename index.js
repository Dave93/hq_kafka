require("dotenv").config();
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");
// const { Kafka } = require("kafkajs");
const { Markup, Scenes, Telegraf } = require("telegraf");
const telegrafPlugin = require("fastify-telegraf");
const fastify = require("fastify");
const amqp = require('amqplib/callback_api');

const { AMQP_VHOST, AMQP_HOST, AMQP_PORT, AMQP_USER, AMQP_PASSWORD } = process.env;

const AMQP_ENDPOINT = `amqp://${AMQP_USER}:${AMQP_PASSWORD}@${AMQP_HOST}:${AMQP_PORT}${AMQP_VHOST}`;


// Connection URL
const url = process.env.MONGODB_URL;
const client = new MongoClient(url);

// Database Name
const dbName = "orders_schedule";
const { TELEGRAM_TOKEN, WEBHOOK_URL } = process.env;
const PORT = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== "production";

if (!TELEGRAM_TOKEN) throw new Error('"BOT_TOKEN" env var is required!');

const bot = new Telegraf(TELEGRAM_TOKEN);


const app = fastify({
    logger: true,
});


bot.start(async (ctx) => {
    return ctx.reply(`Your id: ${ctx.message.chat.id}`)

});

const SECRET_PATH = `/telegraf/${bot.secretPathComponent()}`;
app.register(telegrafPlugin, { bot, path: SECRET_PATH });

if (dev) {
    bot.launch();
} else {
    if (!WEBHOOK_URL) throw new Error('"WEBHOOK_URL" env var is required!');
    bot.telegram.setWebhook(WEBHOOK_URL + SECRET_PATH).then(() => {
        console.log("Webhook is set on", WEBHOOK_URL + SECRET_PATH);
    });

    app.listen(PORT).then(() => {
        console.log("Listening on port", PORT);
    });
}

function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
}

// (async () => {
//   const kafka = new Kafka({
//     // clientId: "my-app",
//     brokers: [process.env.KAFKA_BORKER],
//     // sasl: {
//     //   mechanism: "scram-sha-512", // scram-sha-256 or scram-sha-512
//     //   // username: "chopar_davr", // producer
//     //   // password: "mNw7@T8P`theQj#T", // producer
//     //   username: "hq_consumer", // consumer
//     //   password: 'C_22!%tt77YS*A&y', // consumer
//     // },
//     // ssl: {
//     //   ca: [fs.readFileSync(path.join(__dirname + "/ca.crt"), "utf-8")],
//     // },
//   });
//   const consumer = kafka.consumer({ groupId: "hq" });
//
//   await consumer.connect();
//   await consumer.subscribe({ topic: "hq"/*, fromBeginning: true*/ });
//
//   await consumer.run({
//     eachMessage: async ({ topic, partition, message }) => {
//       // console.log(topic)
//       // console.log({
//       //   value: message.value.toString(),
//       // });
//
//       // console.log(JSON.parse(message.value.toString()))
//         console.log(message)
//       try {
//           const mess = JSON.parse(message.value.toString());
//           // console.log(mess.action);
//           // console.log('fileExists', fs.existsSync(path.join(`${__dirname}/actions/${mess.action}.js`)))
//
//           if (mess.action == 'order_to_tg_group') {
//               fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(mess.data));
//               let order = mess.data;
//               let paymentType = order.type;
//               if (paymentType.toLowerCase() == 'offline') {
//                   paymentType = 'Наличными';
//               }
//               let deliverType = (order.delivery_type == 'deliver' ? '🚘 Доставка' : '🚶 самовывоз');
//               let basketItems = '';
//               let totalPrice = 0;
//               order.basket.lines.map(line => {
//                   let lineTotalPrice = +line.total;
//                   totalPrice += lineTotalPrice * line.quantity;
//                   if (line.modifiers) {
//                       line.modifiers.map((mod) => {
//                           lineTotalPrice -= mod.price;
//                       });
//                   }
//                   basketItems += `<b>${line?.variant?.product?.attribute_data?.name?.chopar?.ru}</b>
// ${line.quantity} x ${formatNumber(
//                       +lineTotalPrice
//                   )} = ${formatNumber(+lineTotalPrice * line.quantity)} сум`;
//
//                   if (line.modifiers) {
//                       line.modifiers.map((mod) => {
//                           basketItems += `\n-- ${line.quantity} x ${
//                               mod.name
//                           } = ${formatNumber(mod.price * line.quantity)} сум`;
//                       });
//                   }
//                   basketItems += "\n\n";
//               });
//
//               basketItems += '----------------------------\n';
//               basketItems += `<b>ИТОГО: ${formatNumber(totalPrice)} сум</b>`
//               let message = `<b>Номер заказа:</b> #${order.id}
//
// <b>Система:</b> Веб-сайт
// <b>Клиент:</b> ${order.user.name}
// <b>Телефон:</b> ${order.shipping_phone}
// <b>Адрес:</b> ${order.shipping_address}${(order.house ? ', дом ' + order.house : '')}${(order.flat ? ', квартира ' + order.flat : '')}${(order.entrance ? ', подъезд ' + order.entrance : '')}${(order.door_code ? ', код от домофона ' + order.door_code : '')}
// <b>Способ оплаты:</b> ${paymentType}
// <b>Способ доставки:</b> ${deliverType}
// <b>Филиал:</b> ${order.terminalData.name}
// <b>Состав заказа:</b>
//
// ${basketItems}
// `
//
//               await bot.telegram.sendMessage(order.terminalData.tg_group, message, {
//                   parse_mode: 'HTML'
//               });
//               if (order.delivery_type == 'deliver') {
//                   await  bot.telegram.sendLocation(order.terminalData.tg_group, order.lat, order.lon);
//               }
//               await bot.telegram.sendMessage(-758028372, message, {
//                   parse_mode: 'HTML'
//               });
//               if (order.delivery_type == 'deliver') {
//                   await  bot.telegram.sendLocation(-758028372, order.lat, order.lon);
//               }
//
//               return;
//           }
//           // console.log('fileExists', fs.existsSync(path.join(`${__dirname}/actions/${mess.action}.js`)))
//           // const action = require(path.join(`${__dirname}/actions/${mess.action}.js`));
//           // await action(mess.data)
//
//           if (mess.action == 'send_order_later') {
//               // Use connect method to connect to the server
//               await client.connect();
//               const db = client.db(dbName);
//               const collection = db.collection("documents");
//               await collection.insertOne({
//                   ...mess.data,
//                   sent: false
//               });
//               client.close();
//               return;
//           }
//         const action = require(path.join(`${__dirname}/actions/${mess.action}.js`));
//         await action(mess.data)
//       } catch (e) {
//         console.log(e);
//       }
//
//     },
//   });
// })();


amqp.connect(AMQP_ENDPOINT, function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }
        var exchange = 'actions';

        channel.assertExchange(exchange, 'fanout', {
            durable: false
        });

        channel.assertQueue('', {
            exclusive: true
        }, function(error2, q) {
            if (error2) {
                throw error2;
            }
            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
            channel.bindQueue(q.queue, exchange, '');

            channel.consume(q.queue, async mess => {
                if (mess.content) {
                    try {
                        mess = JSON.parse(mess.content.toString());
                        console.log(mess);

                          if (mess.action == 'order_to_tg_group') {
                              fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(mess.data));
                              let order = mess.data;
                              let paymentType = order.type;
                              if (paymentType.toLowerCase() == 'offline') {
                                  paymentType = 'Наличными';
                              }
                              let deliverType = (order.delivery_type == 'deliver' ? '🚘 Доставка' : '🚶 самовывоз');
                              let basketItems = '';
                              let totalPrice = 0;
                              order.basket.lines.map(line => {
                                  let lineTotalPrice = +line.total;
                                  totalPrice += lineTotalPrice * line.quantity;
                                  if (line.modifiers) {
                                      line.modifiers.map((mod) => {
                                          lineTotalPrice -= mod.price;
                                      });
                                  }
                                  basketItems += `<b>${line?.variant?.product?.attribute_data?.name?.chopar?.ru}</b>
    ${line.quantity} x ${formatNumber(
                                      +lineTotalPrice
                                  )} = ${formatNumber(+lineTotalPrice * line.quantity)} сум`;

                                  if (line.modifiers) {
                                      line.modifiers.map((mod) => {
                                          basketItems += `\n-- ${line.quantity} x ${
                                              mod.name
                                          } = ${formatNumber(mod.price * line.quantity)} сум`;
                                      });
                                  }
                                  basketItems += "\n\n";
                              });

                              basketItems += '----------------------------\n';
                              basketItems += `<b>ИТОГО: ${formatNumber(totalPrice)} сум</b>`
                              let message = `<b>Номер заказа:</b> #${order.id}

    <b>Система:</b> Веб-сайт
    <b>Клиент:</b> ${order.user.name}
    <b>Телефон:</b> ${order.shipping_phone}
    <b>Адрес:</b> ${order.shipping_address}${(order.house ? ', дом ' + order.house : '')}${(order.flat ? ', квартира ' + order.flat : '')}${(order.entrance ? ', подъезд ' + order.entrance : '')}${(order.door_code ? ', код от домофона ' + order.door_code : '')}
    <b>Способ оплаты:</b> ${paymentType}
    <b>Способ доставки:</b> ${deliverType}
    <b>Филиал:</b> ${order.terminalData.name}
    <b>Состав заказа:</b>

    ${basketItems}
    `

                              await bot.telegram.sendMessage(order.terminalData.tg_group, message, {
                                  parse_mode: 'HTML'
                              });
                              if (order.delivery_type == 'deliver') {
                                  await bot.telegram.sendLocation(order.terminalData.tg_group, order.lat, order.lon);
                              }
                              await bot.telegram.sendMessage(-758028372, message, {
                                  parse_mode: 'HTML'
                              });
                              if (order.delivery_type == 'deliver') {
                                  await bot.telegram.sendLocation(-758028372, order.lat, order.lon);
                              }

                              return;
                          }
                        // console.log('fileExists', fs.existsSync(path.join(`${__dirname}/actions/${mess.action}.js`)))
                        // const action = require(path.join(`${__dirname}/actions/${mess.action}.js`));
                        // await action(mess.data)

                        if (mess.action == 'send_order_later') {
                            // Use connect method to connect to the server
                            await client.connect();
                            const db = client.db(dbName);
                            const collection = db.collection("documents");
                            await collection.insertOne({
                                ...mess.data,
                                sent: false
                            });
                            client.close();
                            return;
                        }


                        if(mess.action) {
                            console.log(path.join(__dirname, `/actions/${mess.action}`));
                            const action = require(path.join(__dirname, `/actions/${mess.action}`));
                            await action(mess.data);
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
            }, {
                noAck: true
            });
        });
    });
});
