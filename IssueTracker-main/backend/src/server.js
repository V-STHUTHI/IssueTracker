import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import express from 'express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import cors from 'cors';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { connectDB } from './db.js';

const PORT = 3001;

// Create executable schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create Express app and HTTP server
const app = express();
const httpServer = createServer(app);

// Create WebSocket server for Subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

// Setup WebSocket server cleanup
const serverCleanup = useServer({ schema }, wsServer);

// Initialize Apollo Server
const server = new ApolloServer({
  schema,
  plugins: [
    // Proper shutdown for the HTTP server
    ApolloServerPluginDrainHttpServer({ httpServer }),

    // Proper shutdown for the WebSocket server
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

// Connect to MongoDB
await connectDB();

// Start Apollo Server
await server.start();

// Use Express middleware
app.use(
  '/graphql',
  cors(),
  express.json(),
  expressMiddleware(server)
);

// Root route for convenience
app.get('/', (req, res) => {
  res.send('IssueTracker GraphQL Server is running. Visit <a href="/graphql">/graphql</a> for GraphiQL playground.');
});

// Start listening
httpServer.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}/graphql`);
});
