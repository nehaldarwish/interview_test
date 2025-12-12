import { FastifyPluginAsync } from 'fastify';
import { ChatService } from '../../services/chat-service';

const chatService = new ChatService();

const chats: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // Create a new chat
  fastify.post('/', async function (request, reply) {
    try {
      const chat = await chatService.createChat();
      reply.send({
        id: chat.id,
        name: chat.name,
        messages: chat.messages,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ 
        error: 'Failed to create chat',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all chats
  fastify.get('/', async function (request, reply) {
    try {
      const allChats = await chatService.getAllChats();
      reply.send({
        chats: allChats.map(chat => ({
          id: chat.id,
          name: chat.name,
          messageCount: chat.messages.length,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
        })),
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ 
        error: 'Failed to fetch chats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get a specific chat with messages
  fastify.get('/:chatId', async function (request, reply) {
    try {
      const { chatId } = request.params as { chatId: string };
      const chat = await chatService.getChat(chatId);
      
      if (!chat) {
        reply.status(404).send({ error: 'Chat not found' });
        return;
      }

      reply.send({
        id: chat.id,
        name: chat.name,
        messages: chat.messages,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ 
        error: 'Failed to fetch chat',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Send a message in a chat
  fastify.post('/:chatId/messages', async function (request, reply) {
    try {
      const { chatId } = request.params as { chatId: string };
      const { content, model } = request.body as { content: string; model?: string };

      if (!content || !content.trim()) {
        reply.status(400).send({ error: 'Message content is required' });
        return;
      }

      const assistantMessage = await chatService.sendMessage(chatId, content.trim(), model);
      const chat = await chatService.getChat(chatId);
      
      reply.send({
        message: assistantMessage,  // Can be string or structured content
        chat: chat ? {
          id: chat.id,
          name: chat.name,
          messages: chat.messages,
          updatedAt: chat.updatedAt,
        } : null,
      });
    } catch (error) {
      fastify.log.error(error);
      
      if (error instanceof Error) {
        if (error.message === 'Chat not found') {
          reply.status(404).send({ error: 'Chat not found' });
          return;
        }
        
        // Handle LLM API errors
        reply.status(500).send({ 
          error: 'Failed to send message',
          message: error.message
        });
      } else {
        reply.status(500).send({ error: 'Failed to send message' });
      }
    }
  });

  // Delete a chat
  fastify.delete('/:chatId', async function (request, reply) {
    try {
      const { chatId } = request.params as { chatId: string };
      const deleted = await chatService.deleteChat(chatId);
      
      if (!deleted) {
        reply.status(404).send({ error: 'Chat not found' });
        return;
      }

      reply.send({ success: true });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ 
        error: 'Failed to delete chat',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
};

export default chats;