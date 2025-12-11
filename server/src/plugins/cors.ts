import { FastifyPluginAsync } from 'fastify';
import fastifyCors from '@fastify/cors';
import fp from 'fastify-plugin';

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyCors, {
    origin: "http://localhost:3000",        // important: exact origin, not true
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],  // add this
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });
};

export default fp(corsPlugin);