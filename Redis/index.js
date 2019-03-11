const EventEmitter = require('events')
const Redis = require('ioredis')
const config = require('./config')

const subscriber = new Redis(config)

const redis = new Redis(config)

redis.config('set', 'notify-keyspace-events', 'Kx')

const appEvents = new EventEmitter()

const openSubscription = async (eventCallback) => {
  const eventSub = await subscriber.psubscribe('__keyspace@0__:*')
    .catch(err => err instanceof Error ? err : new Error(err))

  if (eventSub instanceof Error || !eventSub) {
    return console.error('subscription Error:', eventSub)
  }

  appEvents.on('expiredEvent', eventCallback)
}

const closeSubscription = async (cleanupCallback) => {
  await subscriber.punsubscribe('__keyspace@0__:*')

  return cleanupCallback()
}

subscriber.on('pmessage', (pattern, channel, message) => {
  const [time] = channel.split(':').slice(2)

  const actualTime = Date.now()

  appEvents.emit('expiredEvent', { time: Number(time), actualTime })
})

module.exports = {
  redis,
  openSubscription,
  closeSubscription
}
