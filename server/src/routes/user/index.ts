import { FastifyPluginAsync } from 'fastify'
import { testUsers } from "../../domain/test-users";

const user: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/', async function (request, reply) {
    // Since auth is out of scope, just return the first user (richard)
    const userId = 'richard';
    const user = testUsers[userId];
    reply.send({
      id: userId,
      name: user.name,
      email: user.email,
    });
  });
};

export default user