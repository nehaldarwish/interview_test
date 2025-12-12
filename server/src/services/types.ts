export interface Deliverable {
  title: string;
  description: string;
}

export interface Workstream {
  id: string;
  title: string;
  description: string;
  deliverables: Deliverable[];
}

export interface ProjectPlan {
  title?: string;
  workstreams: Workstream[];
}

export type MessageContent = string | {
  text?: string;
  projectPlan?: ProjectPlan;
};

export interface Message {
  role: 'user' | 'assistant';
  content: MessageContent;
}

export interface Chat {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}