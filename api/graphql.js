const { ApolloServer } = require('./apollo-server')
const schema = require('./schema')

// TODO: better detection here
const isDev = process.env.NODE_ENV != "production"

const server = new ApolloServer({
  schema,
  introspection: isDev,
  playground: isDev,
  tracing: isDev,
})

const graphqlHandler = server.createHandler({
  cors: {
    origin: true,
    credentials: true,
    allowedHeaders: 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent,X-Apollo-Tracing'
  },
})

const LOG_THRESHOLD = 2000

module.exports.lambda = graphqlHandler
