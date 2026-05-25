export interface CommandHandler {
  name: string;
  description: string;
  usage: string;
  execute(args: string[]): Promise<void>;
}

export type CommandRegistry = Record<string, CommandHandler>;
