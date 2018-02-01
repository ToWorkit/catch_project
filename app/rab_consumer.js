/**
 * 消费者
 * @type {String}
 */
var q = 'tasks';
var process = require('child_process');
var amqp = require('amqplib');

// https://github.com/squaremo/amqp.node/blob/master/examples/tutorials/worker.js

// 连接rabbitmq 账户:密码@地址:端口
amqp.connect('amqp://rabbitmq:12345678@127.0.0.1:5672/').then(function(conn) {
  // process.once('SIGINT', function() { conn.close(); });
  // 创建会话队列
  return conn.createChannel().then(function(ch) {
    // 与名为 hello 的会话队列建立连接
    var ok = ch.assertQueue('hello', {durable: true});
    ok = ok.then(function() { ch.prefetch(1); });
    ok = ok.then(function() {
      // 成功连接
      ch.consume('hello', doWork, {noAck: false});
      console.log(" [*] Waiting for messages. To exit press CTRL+C");
    });
    return ok;
    function doWork(msg) {
      // 接收发布者传递的参数
      var body = msg.content.toString();
      console.log("[x] Received '%s'", body);
      let _body = JSON.parse(body)
      let channel_book_id = _body['channel_book_id'];
      let book_id = _body['book_id'];
      let channel_id = _body['channel_id'];
      console.log(channel_book_id, book_id, channel_id)
      // node 执行cmd(shell)命令
      // node test.js \/${channel_id + "_" + channel_book_id} ${channel_book_id} ${book_id} cmd 输入
      process.exec(`node test.js \/${channel_id + "_" + channel_book_id} ${channel_book_id} ${book_id}`,function (error, stdout, stderr) {
          if (error !== null) {
            console.log('exec error: ' + error);
          }
          // 执行结果
          console.log(stdout)
          console.log(stderr)
          // 关闭当前队列的连接
          ch.ack(msg);
      });
/*      var secs = body.split('.').length - 1;
      //console.log(" [x] Task takes %d seconds", secs);
      setTimeout(function() {
        console.log(" [x] Done");
        ch.ack(msg);
      }, secs * 1000);*/
    }
  });
}).catch(console.warn);



