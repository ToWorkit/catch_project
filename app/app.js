/**
 * 发布者
 * @type {[type]}
 */
let express = require('express'),
    app = express(),
    tadu = require('../tadu__.js'),
    amqp = require('amqplib');

app.get('/', (req, res, next) => {
  res.send('Hello World');
});

// https://github.com/squaremo/amqp.node

// 请求_01
app.get('/tadu', (req, res, next) => {
  /*setTimeout(() => {
    // res.send('请求_01 完成');
    res.json({
      code:200,
      userid:123
    });
  }, 1000);*/

  // 连接rabbitmq 账户:密码@端口
  amqp.connect('amqp://rabbitmq:12345678@127.0.0.1:5672/').then(function(conn) {
    // 创建会话队列
    return conn.createChannel().then(function(ch) {
      var q = 'hello';
      var msg = JSON.stringify({
        "channel_id": req.query.channel_id,
        "channel_book_id": req.query.channel_book_id,
        "book_id": req.query.book_id,
      })
      // 建立连接 q
      var ok = ch.assertQueue(q, {durable: true});
      return ok.then(function(_qok) {
        // 发送数据 到 消费者
        ch.sendToQueue(q, Buffer.from(msg));
        console.log(" [x] Sent '%s'", msg);
        return ch.close();
      });
    }).finally(function() { conn.close(); });
  }).catch(console.warn);
  res.send('请求_01 完成');
  /*(async () => {
    try {
      await tadu.init(req.query.bookId, 'test')
    } catch(err) {
      res.send('err');
    }
  })()*/

/*  res.send('请求_01 完成');
  console.log(111)*/
});

app.listen(3000, () => console.log(3000));
