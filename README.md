# Redis-Keyspace-Event-Test
Testing the reliability and timing of key expiration events in Redis

Long story short, do not use expiration events as timers for your application. They are so unbelievably unreliable at scale. Anything nearing 5000 keys with TTL set becomes unstable. As you go beyond 10,000, the odds that your key will emit an expiration event at all diminishes into oblivion. Back to the drawing board.
