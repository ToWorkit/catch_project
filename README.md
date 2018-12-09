# 抓书工程化

> 保证同一时间相同书籍的抓取只能有一个程序在执行，多次操作放入队列中依次执行

## zookeeper

> https://github.com/alexguan/node-zookeeper-client
> 加锁，防止数据污染
> app -> test.js

## rabbitmq

> https://github.com/squaremo/amqp.node/blob/master/examples/tutorials/worker.js
> https://github.com/squaremo/amqp.node
> 发布者: app -> app.js => 接收请求参数并将数据发送到消费者
> 消费者: app -> rab_consumer.js => 获取到发布者传递的参数后调用node模块(process)执行命令行并将数据传递到zookeeper操作文件中(test.js)
> 最终由test.js完成书籍的抓取操作
