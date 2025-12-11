import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { testUsers } from '../domain/test-users';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: keyof typeof testUsers;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    // Allow CORS preflight (OPTIONS) to pass through without auth
    if (request.method === 'OPTIONS') {
      return; // let CORS plugin handle it → returns 204 automatically
    }

    const auth = request.headers.authorization?.trim();

    if (!auth || !(auth in testUsers)) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    request.userId = auth as keyof typeof testUsers;
  });
};

export default fp(authPlugin, { name: 'auth' });