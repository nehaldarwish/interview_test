// server/src/app.ts
import 'dotenv/config';
import { join } from 'node:path'
import AutoLoad from '@fastify/autoload'
import { FastifyPluginAsync } from 'fastify'

const app: FastifyPluginAsync = async (fastify): Promise<void> => {
  // Load all plugins automatically (including auth.ts and cors.ts)
  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    // AutoLoad will pick up auth.ts and cors.ts automatically
    // No need to register them manually!
  })

  // Load all routes automatically
  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
  })

  // OPTIONAL: if you want to be 100% explicit and control order,
  // you can also do this (but it's redundant with AutoLoad):
  // await fastify.register(import('./plugins/auth'))
  // await fastify.register(import('./plugins/cors'))
}

export default app
export { app }