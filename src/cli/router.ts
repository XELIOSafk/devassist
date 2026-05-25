import { Formatter, colors } from '../ui';
import { CommandRegistry } from './types';

export class Router {
  constructor(private commands: CommandRegistry) {}

  async route(argv: string[]): Promise<void> {
    const [cmdName, ...args] = argv;

    if (!cmdName || cmdName === 'help' || cmdName === '--help' || cmdName === '-h') {
      this.showHelp();
      return;
    }

    const cmd = this.commands[cmdName];
    if (!cmd) {
      Formatter.error(`Unknown command: ${cmdName}`);
      Formatter.dimText(`Run ${colors.primary('devassist help')} for available commands.`);
      process.exit(1);
    }

    try {
      await cmd.execute(args);
    } catch (err) {
      Formatter.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  }

  private showHelp(): void {
    Formatter.title('DevAssist - AI-powered developer assistant');
    Formatter.spacer();
    Formatter.section('USAGE');
    Formatter.text('  devassist <command> [options]');
    Formatter.spacer();
    Formatter.section('COMMANDS');

    Object.values(this.commands).forEach(cmd => {
      Formatter.text(`  ${colors.primary(cmd.name.padEnd(15))} ${cmd.description}`);
      if (cmd.usage) {
        Formatter.dimText(`    ${cmd.usage}`);
      }
    });

    Formatter.spacer();
    Formatter.section('INTERACTIVE MODE');
    Formatter.text('  Run without arguments to enter interactive mode:');
    Formatter.text(`    ${colors.primary('devassist')}`);
    Formatter.spacer();
  }
}
