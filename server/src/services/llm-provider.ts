import type { Message, MessageContent, ProjectPlan } from './types';

export interface LLMProvider {
  generateResponse(messages: Message[]): Promise<MessageContent>;
}

// Helper to extract plain text from message content
function getMessageText(content: MessageContent): string {
  if (typeof content === 'string') return content;
  return content.text || '';
}

// Fallback: Parse markdown-style project plans
function tryParseMarkdownProjectPlan(text: string): MessageContent | null {
  // Check if it looks like a project plan
  const hasWorkstreams = /\d+\.\s*\*\*[^*]+\*\*:/.test(text);
  const hasDeliverables = /\s+-\s+\*\*[^*]+\*\*:/.test(text);
  
  if (!hasWorkstreams || !hasDeliverables) {
    return null; // Not a project plan format
  }

  try {
    const workstreams: any[] = [];
    
    // Split by numbered sections (workstreams)
    const workstreamMatches = text.matchAll(/(\d+)\.\s*\*\*([^*]+)\*\*:\s*([^\n]+)((?:\n\s+-\s+\*\*[^*]+\*\*:[^\n]+)*)/g);
    
    let workstreamIndex = 0;
    for (const match of workstreamMatches) {
      const [, , title, description, deliverablesText] = match;
      
      if (title.toLowerCase().includes('workstream') || 
          title.toLowerCase().includes('deliverable') ||
          title.toLowerCase().includes('timeline') ||
          title.toLowerCase().includes('approach') ||
          title.toLowerCase().includes('stakeholder')) {
        continue; // Skip non-workstream sections
      }
      
      // Parse deliverables
      const deliverables: any[] = [];
      const deliverableMatches = deliverablesText.matchAll(/\s+-\s+\*\*([^*]+)\*\*:\s*([^\n]+)/g);
      
      for (const delMatch of deliverableMatches) {
        const [, delTitle, delDesc] = delMatch;
        deliverables.push({
          title: delTitle.trim(),
          description: delDesc.trim()
        });
      }
      
      if (deliverables.length > 0) {
        workstreams.push({
          id: `ws-${workstreamIndex + 1}`,
          title: title.trim(),
          description: description.trim(),
          deliverables
        });
        workstreamIndex++;
      }
    }
    
    if (workstreams.length > 0) {
      // Extract introduction text before the first workstream
      const firstWorkstreamMatch = text.match(/\d+\.\s*\*\*[^*]+\*\*/);
      const introText = firstWorkstreamMatch 
        ? text.substring(0, firstWorkstreamMatch.index).trim()
        : '';
      
      return {
        text: introText + "\n\n{{PROJECT_PLAN}}",
        projectPlan: {
          title: "Project Workstreams",
          workstreams
        }
      };
    }
  } catch (error) {
    console.error('Failed to parse markdown project plan:', error);
  }
  
  return null;
}

// OpenAI Provider with Function Calling for Project Plans
class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateResponse(messages: Message[]): Promise<MessageContent> {
    // Add system message to encourage function use
    const systemMessage = {
      role: 'system' as const,
      content: 'When users ask for project plans, roadmaps, implementation plans, or workstream breakdowns, you MUST use the create_project_plan function to provide a structured response. Never format project plans as plain text.'
    };

    // Convert messages to OpenAI format
    const openAIMessages = [
      systemMessage,
      ...messages.map(msg => ({
        role: msg.role,
        content: getMessageText(msg.content)
      }))
    ];

    // Define function for creating project plans
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "create_project_plan",
          description: "Creates a structured, interactive project plan with workstreams and deliverables. ALWAYS use this function when the user requests: a project plan, roadmap, implementation plan, workstream breakdown, project structure, or any organized breakdown of work. The function creates a beautiful, expandable UI component.",
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Optional title for the project plan"
              },
              workstreams: {
                type: "array",
                description: "List of workstreams in the project",
                items: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description: "Title of the workstream"
                    },
                    description: {
                      type: "string",
                      description: "Detailed description of the workstream"
                    },
                    deliverables: {
                      type: "array",
                      description: "List of deliverables for this workstream",
                      items: {
                        type: "object",
                        properties: {
                          title: {
                            type: "string",
                            description: "Title of the deliverable"
                          },
                          description: {
                            type: "string",
                            description: "Detailed description of the deliverable"
                          }
                        },
                        required: ["title", "description"]
                      }
                    }
                  },
                  required: ["title", "description", "deliverables"]
                }
              },
              explanation: {
                type: "string",
                description: "Text to accompany the project plan, explaining the approach and asking if the user needs more details"
              }
            },
            required: ["workstreams", "explanation"]
          }
        }
      }
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: openAIMessages,
          tools,
          tool_choice: "auto" // Let the model decide, but it should prefer the function
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      const message = data.choices[0].message;

      // Check if the model used a tool (function call)
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        
        if (toolCall.function.name === 'create_project_plan') {
          const args = JSON.parse(toolCall.function.arguments);
          
          // Add IDs to workstreams
          const workstreams = args.workstreams.map((ws: any, index: number) => ({
            id: `ws-${index + 1}`,
            ...ws
          }));

          const projectPlan: ProjectPlan = {
            title: args.title,
            workstreams
          };

          return {
            text: args.explanation + "\n\n{{PROJECT_PLAN}}",
            projectPlan
          };
        }
      }

      // Regular text response (no project plan)
      const responseText = message.content || "I apologize, but I couldn't generate a response.";
      
      // Try to parse as markdown project plan (fallback)
      const parsedPlan = tryParseMarkdownProjectPlan(responseText);
      if (parsedPlan) {
        return parsedPlan;
      }
      
      return responseText;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Anthropic Claude Provider (similar approach)
class AnthropicProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-sonnet-4-20250514') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateResponse(messages: Message[]): Promise<MessageContent> {
    // Add system message to encourage tool use
    const systemMessage = {
      role: 'user' as const,
      content: 'System instruction: When users ask for project plans, roadmaps, implementation plans, or workstream breakdowns, you MUST use the create_project_plan tool to provide a structured response.'
    };

    // Convert messages to Anthropic format
    const anthropicMessages = [
      systemMessage,
      ...messages.map(msg => ({
        role: msg.role,
        content: getMessageText(msg.content)
      }))
    ];

    // Define tool for creating project plans
    const tools = [
      {
        name: "create_project_plan",
        description: "Creates a structured, interactive project plan with workstreams and deliverables. ALWAYS use this tool when the user requests: a project plan, roadmap, implementation plan, workstream breakdown, project structure, or any organized breakdown of work.",
        input_schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Optional title for the project plan"
            },
            workstreams: {
              type: "array",
              description: "List of workstreams in the project",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Title of the workstream" },
                  description: { type: "string", description: "Detailed description of the workstream" },
                  deliverables: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" }
                      },
                      required: ["title", "description"]
                    }
                  }
                },
                required: ["title", "description", "deliverables"]
              }
            },
            explanation: {
              type: "string",
              description: "Text to accompany the project plan"
            }
          },
          required: ["workstreams", "explanation"]
        }
      }
    ];

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          messages: anthropicMessages,
          tools
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      // Check for tool use
      const toolUseBlock = data.content.find((block: any) => block.type === 'tool_use');
      
      if (toolUseBlock && toolUseBlock.name === 'create_project_plan') {
        const input = toolUseBlock.input;
        
        const workstreams = input.workstreams.map((ws: any, index: number) => ({
          id: `ws-${index + 1}`,
          ...ws
        }));

        const projectPlan: ProjectPlan = {
          title: input.title,
          workstreams
        };

        return {
          text: input.explanation + "\n\n{{PROJECT_PLAN}}",
          projectPlan
        };
      }

      // Regular text response
      const textBlock = data.content.find((block: any) => block.type === 'text');
      return textBlock?.text || "I apologize, but I couldn't generate a response.";
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Google Gemini Provider
class GeminiProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-2.0-flash-exp') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateResponse(messages: Message[]): Promise<MessageContent> {
    // Convert messages to Gemini format
    const geminiMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: getMessageText(msg.content) }]
    }));

    // Gemini uses function declarations
    const tools = [{
      functionDeclarations: [{
        name: "create_project_plan",
        description: "Creates a structured project plan with workstreams and deliverables",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Optional title for the project plan" },
            workstreams: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  deliverables: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" }
                      }
                    }
                  }
                }
              }
            },
            explanation: { type: "string" }
          },
          required: ["workstreams", "explanation"]
        }
      }]
    }];

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: geminiMessages,
            tools
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      const candidate = data.candidates[0];
      const content = candidate.content;

      // Check for function call
      const functionCall = content.parts.find((part: any) => part.functionCall);
      
      if (functionCall && functionCall.functionCall.name === 'create_project_plan') {
        const args = functionCall.functionCall.args;
        
        const workstreams = args.workstreams.map((ws: any, index: number) => ({
          id: `ws-${index + 1}`,
          ...ws
        }));

        const projectPlan: ProjectPlan = {
          title: args.title,
          workstreams
        };

        return {
          text: args.explanation + "\n\n{{PROJECT_PLAN}}",
          projectPlan
        };
      }

      // Regular text response
      const textPart = content.parts.find((part: any) => part.text);
      return textPart?.text || "I apologize, but I couldn't generate a response.";
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Factory function to get the appropriate provider
export function getLLMProvider(model: string): LLMProvider {
  // Get API keys from environment variables
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (model.startsWith('gpt-')) {
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    return new OpenAIProvider(openaiKey, model);
  } else if (model.startsWith('claude-')) {
    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    return new AnthropicProvider(anthropicKey, model);
  } else if (model.startsWith('gemini-')) {
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    return new GeminiProvider(geminiKey, model);
  }

  throw new Error(`Unsupported model: ${model}`);
}