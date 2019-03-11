const fs = require('fs')
const uuid = require('uuid')
const { redis, openSubscription, closeSubscription } = require('./Redis')

const DELAY = 5000
const DURATION = 60000
const SET = 5000

const testResults = {
  duration: DURATION,
  totalSet: 0,
  totalEvents: 0,
  cumulativeDelay: 0,
  averageDelay: 0,
  longestDelays: Array(50).fill(0),
  shortestDelays: Array(50).fill(DURATION),
  allDelays: []
}

openSubscription(({time, actualTime}) => {
  const disparity = actualTime - time

  if (disparity > testResults.longestDelays[0]) {
    testResults.longestDelays.splice(0, 1, disparity)
    testResults.longestDelays.sort((a, b) => a - b)
  }

  if (disparity < testResults.shortestDelays[0]) {
    testResults.shortestDelays.splice(0, 1, disparity)
    testResults.shortestDelays.sort((a, b) => b - a)
  }

  testResults.allDelays.push(disparity)

  testResults.cumulativeDelay += disparity

  testResults.totalEvents++

  if (testResults.totalEvents === testResults.totalSet) {
    testResults.averageDelay = Math.floor(testResults.cumulativeDelay / testResults.totalEvents)
    closeSubscription(() => {
      fs.writeFile(
        `./testResults/${Date.now()}.json`,
        JSON.stringify(testResults, null, 2),
        err => err ? console.error(err) : console.log('Success!')
      )
    })
  }
})

async function setSomeKeys () {
  const pipeline = redis.pipeline()

  let i = 10
  while (i-- > 0) {
    const id = uuid()
    const expiryDelay = Math.floor(Math.random() * DURATION) + DELAY
    const time = Date.now() + expiryDelay

    pipeline.set(`${id}:${time}`, '1', 'PX', expiryDelay)
  }

  const results = await pipeline.exec().catch(err => err instanceof Error ? err : new Error(err))

  if (results instanceof Error) return console.error(results)

  const successful = results.filter(([err, ok]) => !err && ok).length

  testResults.totalSet += successful

  console.log(testResults.totalSet)
}

let i = Math.floor(SET / 10)
while (i-- > 0) setSomeKeys()

setTimeout(() => {
  console.log('Duration has been reached')
}, DURATION + DELAY)
