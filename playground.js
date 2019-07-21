const lambdaPlayground = require('graphql-playground-middleware-lambda').default

exports.lambda = lambdaPlayground({
  endpoint: '/dev/graphql',
})
