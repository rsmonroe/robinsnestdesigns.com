const { ApolloServer } = require('./apollo-server')
const { MyDB } = require('./datasources')
const { typeDefs } = require('./schema')
const { resolvers } = require('./resolvers')
const knex = require('./knex')

const isDev =  true

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: isDev,
  playground: isDev,
  tracing: isDev,
  dataSources: () => {
    return {
      db: new MyDB(),
    }
  }
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
