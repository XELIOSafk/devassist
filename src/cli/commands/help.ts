import { CommandHandler } from '../types';
import { Formatter, colors } from '../../ui';

export const helpCommand: CommandHandler = {
  name: 'help',
  description: 'Show help and available commands',
  usage: 'devassist help',

  async execute(): Promise<void> {
    Formatter.title('DevAssist - AI-powered developer assistant');
    Formatter.spacer();

    Formatter.section('AVAILABLE COMMANDS');
    const commands = [
      { name: 'help', desc: 'Show this help message' },
      { name: 'ask <prompt>', desc: 'Ask DevAssist a question about your code' },
      { name: 'explain', desc: 'Analyze and explain your entire project' },
      { name: 'scan', desc: 'Quick scan of your project structure' },
      { name: 'error <file|log>', desc: 'Analyze an error and get fix suggestions' },
    ];

    commands.forEach(cmd => {
      Formatter.text(`  ${colors.primary(cmd.name.padEnd(20))} ${cmd.desc}`);
    });

    Formatter.spacer();
    Formatter.section('EXAMPLES');
    Formatter.text(`  ${colors.muted('# Ask a quick question')}`);
    Formatter.text(`  devassist ask "how do I fix this TypeScript error?"`);
    Formatter.spacer();
    Formatter.text(`  ${colors.muted('# Analyze an error log')}`);
    Formatter.text(`  devassist error ./logs/error.log`);
    Formatter.spacer();
    Formatter.text(`  ${colors.muted('# Enter interactive mode')}`);
    Formatter.text(`  devassist`);
    Formatter.spacer();
  },
};
