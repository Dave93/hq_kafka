require("dotenv").config();
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");
// const { Kafka } = require("kafkajs");
const { Markup, Scenes, Telegraf } = require("telegraf");
const telegrafPlugin = require("fastify-telegraf");
const fastify = require("fastify");
const amqp = require('amqplib/callback_api');
const admin = require("firebase-admin");

const { AMQP_VHOST, AMQP_HOST, AMQP_PORT, AMQP_USER, AMQP_PASSWORD } = process.env;

const AMQP_ENDPOINT = `amqp://${AMQP_USER}:${AMQP_PASSWORD}@${AMQP_HOST}:${AMQP_PORT}${AMQP_VHOST}`;

// connecting to firebase
var serviceAccount = require(path.join(__dirname, "/serviceAccountKey.json"));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


// Connection URL
const url = process.env.MONGODB_URL;
const client = new MongoClient(url, { useUnifiedTopology: true}, { useNewUrlParser: true }, { connectTimeoutMS: 30000 }, { keepAlive: 1});

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

                        if (mess.action == 'order_update_notify') {
                            let data = mess.data;
                            if (!data.token) {
                                return;
                            }

                            const payload = {
                                notification: {
                                    title: data.title,
                                    body: data.body
                                },
                                data: data.data
                            };

                            // Get the list of device tokens.
                            admin
                                .messaging()
                                .sendToDevice(data.token, payload);
                            return;
                        }

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

                              let prefix = 'S-';
                              let system = 'Сайт';
                              switch (order.source_type) {
                                  case "mobile_web":
                                      prefix = 'SM-';
                                      system = 'Моб. Сайт';
                                  break;
                                  case "bitrix":
                                      prefix = 'C-';
                                      system = 'Колл-центр';
                                  break;
                                  case 'app':
                                      prefix = 'M-';
                                      system = 'Моб. Приложение';
                                  break;
                                  case 'bot':
                                      prefix = 'B-';
                                      system = 'Бот';
                                  break;
                              }

                              let additionalInfo = '';
                              let additionalAddressInfo = '';

                              if (order.tg_house) {
                                  additionalAddressInfo += `<b>Дом, квартира</b>: ${order.tg_house}\n`;
                              }
                              if (order.tg_entrance) {
                                  additionalAddressInfo += `<b>Номер подъезда, код от двери, этаж</b>: ${order.tg_entrance}\n`;
                              }
                              // if (order.) {
                                  additionalInfo += `<b>Нужны приборы и салфетки:</b>: ${order.need_napkins ? "Да" : "Нет"}\n`;
                              // }

                              additionalInfo += `<b>Ориентировочная стоимость доставки:</b> ${new Intl.NumberFormat('ru', {
                                  style: "currency",
                                  currency: "UZS",
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                              })
                                  .format(order.delivery_price)
                                  .replace("UZS", "")} сум\n`

                              additionalInfo += `<b>Ориентировочное расстояние от филиала:</b> ${order.delivery_distance} км\n`

                              additionalInfo += `<b>Комментарий: ${order.notes}</b>`

                              let operator = '';

                              if (order.operator) {
                                  operator = `\n<b>Оператор:</b> ${order.operator}\n`;

                              }

                              let message = `<b>Номер заказа:</b> #${prefix}${order.id}

<b>Система:</b> ${system}${operator}
<b>Клиент:</b> ${order.user.name}
<b>Телефон:</b> ${order.shipping_phone}
<b>Дополнительный номер:</b> ${order.additional_phone}
<b>Адрес:</b> ${order.shipping_address}${(order.house ? ', дом ' + order.house : '')}${(order.flat ? ', квартира ' + order.flat : '')}${(order.entrance ? ', подъезд ' + order.entrance : '')}${(order.door_code ? ', код от домофона ' + order.door_code : '')}
<b>Время доставки:</b> ${order.delivery_schedule == "now" ? "Ближайшее время" : order.delivery_time}
<b>Филиал:</b> ${order.terminalData.name}
${additionalAddressInfo}
<b>Способ оплаты:</b> ${paymentType}
<b>Способ доставки:</b> ${deliverType}
${additionalInfo}
<b>Состав заказа:</b>

${basketItems}

<i>*Сумма доставки не входит в итог заказа</i>
`

                              await bot.telegram.sendMessage(order.terminalData.tg_group, message, {
                                  parse_mode: 'HTML'
                              });
                              if (order.delivery_type == 'deliver') {
                                  await bot.telegram.sendLocation(order.terminalData.tg_group, order.lat, order.lon);
                              }
                              await bot.telegram.sendMessage(order.projectTgGroup, message, {
                                  parse_mode: 'HTML'
                              });
                              if (order.delivery_type == 'deliver') {
                                  await bot.telegram.sendLocation(order.projectTgGroup, order.lat, order.lon);
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
                            // client.close();
                            return;
                        }

                        if (mess.action == 'watch_order_iiko') {
                            // Use connect method to connect to the server
                            await client.connect();
                            const db = client.db(dbName);
                            const collection = db.collection("iiko_watch");
                            await collection.insertOne({
                                ...mess.data
                            });
                            // client.close();
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
