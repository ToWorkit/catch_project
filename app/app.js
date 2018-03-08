/**
 * 发布者
 * @type {[type]}
 */
let express = require('express'),
    app = express(),
    amqp = require('amqplib');

app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  res.header('Access-Control-Allow-Methods', "PUT, POST, GET, DELETE, OPTIONS");
  res.header('Content-Type', 'application/json;charset=utf-8');
  next();
}) 

app.get('/', (req, res, next) => {
  res.send('Hello World');
});

// 简易版请求
app.get('/v1.0/grasp_book', (req, res, next) => {
  // 抓取时需要的参数
  if (!req.query.channel_id && !req.query.channel_book_id) {
    res.send({
      code: 403,
      msg: 'params error'
    })
    return null;
  }
  // 发布者
  // 连接rabbitmq
  amqp.connect('amqp://rabbitmq:12345678@127.0.0.1:5672/').then(function(conn) {
    return conn.createChannel().then(function(ch) {
      // 创建 hello 的消息队列
      var q = 'hello';
      // 解析为json字符串格式作为传递的数据格式
      var msg = JSON.stringify({
        "channel_id": req.query.channel_id,
        "channel_book_id": req.query.channel_book_id,
      })
      // 连接并保持
      var ok = ch.assertQueue(q, {durable: true});
      return ok.then(function(_qok) {
        // 发送数据到消费者
        ch.sendToQueue(q, Buffer.from(msg));
        console.log(" [x] Sent '%s'", msg);
        return ch.close();
      });
    }).finally(function() { conn.close(); });
  }).catch(console.warn);
  res.send({
    code: 200,
    msg: 'success'
  });
});

app.listen(3001, () => console.log(3001));
