/**
 * 消费者
 * @type {String}
 */
var q = 'tasks';
var process = require('child_process');
var amqp = require('amqplib');

var zookeeper = require('node-zookeeper-client');

// 根据标识动态引入js文件
function moduleCustomize(channel_id) {
    return require(`../${channel_id}.js`)
}

 
var client = zookeeper.createClient('127.0.0.1:2181');

async function sleep(second) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('sleep')
    }, second)
  })
}

// 连接_zookeeper
client.once('connected', function () {
  console.log('Connected to the server.');
  // 建立连接 rabbitmp
  amqp.connect('amqp://rabbitmq:12345678@127.0.0.1:5672/').then(function(conn) {
    return conn.createChannel().then(function(ch) {
      // 与名为 hello(由发布者创建) 的消息队列建立连接
      var ok = ch.assertQueue('hello', {durable: true});
      // 预存为1
      ok = ok.then(function() { ch.prefetch(1); });
      ok = ok.then(function() {
        // doWork 回调函数 -> 执行接收到数据后的操作
        ch.consume('hello', doWork, {noAck: false});
      });
      return ok;
      // rabbitmq 处理
      function doWork(msg) {
          // 接收到数据
          var body = msg.content.toString();
          console.log("[x] Received '%s'", body);
          let _body = JSON.parse(body)
          let channel_book_id = _body['channel_book_id'];
          let channel_id = _body['channel_id'];
          if (_body['book_chapter_key']) {
            var book_chapter_key = _body['book_chapter_key'];
          }
          // zookeeper 节点
          let path = `/${channel_id + "_" + channel_book_id}`
          // 连接_zookeeper 判断是否存在
          client.exists(path, function (error, stat) {
              if (error) {
                  console.log(error.stack);
                  return;
              }
              if (stat) {
                console.log('Node exists.');
                // 存在则不执行，但需要将数据传递下去
                // ack 可以参考 https://www.jianshu.com/p/a5f7fce67803
                ch.ack(msg);
              } else {
                  console.log('Node does not exist.');
                  // 操作完成后则释放当前创建的临时节点
                  client.create(path, null, zookeeper.CreateMode.EPHEMERAL, function (error) {
                    if (error) {
                        console.log('Failed to create node: %s due to: %s.', path, error);
                    } else {
                        console.log('Node: %s is successfully created.', path);
                          
                        // 根据传入标识(如书旗就是37)动态引入js文件(抓书的操作)
                        moduleCustomize(channel_id).init(channel_book_id)

                        // 传递数据
                        ch.ack(msg);
                        // 释放当前创建的临时节点
                        client.remove(path, -1, function (error) {
                            if (error) {
                                console.log(error.stack);
                                return;
                            }
                            console.log('Node is deleted.');
                        });

                    }
                  });
                }
              console.log('任务执行完毕')
            });
      }
    });
  }).catch(console.warn);


});
 
client.connect();
