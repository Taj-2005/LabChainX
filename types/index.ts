export interface User {
  id: string;
  name: string;
  email: string;
  institution?: string;
  role?: "researcher" | "reviewer" | "admin";
  verified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Protocol {
  id: string;
  title: string;
  description?: string;
  steps: ProtocolStep[];
  authorId: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProtocolStep {
  id: string;
  order: number;
  title: string;
  reagents?: string[];
  timing?: string;
  equipment?: string[];
  notes?: string;
}

export interface Notebook {
  id: string;
  title: string;
  content: string;
  authorId: string;
  collaborators?: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

