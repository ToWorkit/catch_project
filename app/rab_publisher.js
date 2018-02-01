var q = 'tasks';
var process = require('child_process');

/*var RabbitMQ = require('rabbitmq').createConnect('amqp://rabbitmq:12345678@192.168.0.126:5672/',).RabbitMQ;
var testQueue = new RabbitMQ("test.queue");

 testQueue.publish({test: "test"});*/


var amqp = require('amqplib');

amqp.connect('amqp://rabbitmq:12345678@127.0.0.1:5672/').then(function(conn) {
  return conn.createChannel().then(function(ch) {
    var q = 'hello';
    var msg = '532068, 786';

    var ok = ch.assertQueue(q, {durable: true});

    return ok.then(function(_qok) {
      // NB: `sentToQueue` and `publish` both return a boolean
      // indicating whether it's OK to send again straight away, or
      // (when `false`) that you should wait for the event `'drain'`
      // to fire before writing again. We're just doing the one write,
      // so we'll ignore it.
      ch.sendToQueue(q, Buffer.from(msg));
      console.log(" [x] Sent '%s'", msg);
      return ch.close();
    });
  }).finally(function() { conn.close(); });
}).catch(console.warn);
