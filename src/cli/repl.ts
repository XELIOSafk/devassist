import readline from 'readline';
import { Formatter, spinner, colors } from '../ui';
import { askAI } from '../core/ai';

export class REPL {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async start(): Promise<void> {
    Formatter.title('Interactive Mode');
    Formatter.spacer();
    Formatter.section('Welcome to DevAssist');
    Formatter.text('Ask me anything about your code, project, or errors.');
    Formatter.text(`Type ${colors.primary('exit')} or ${colors.primary('quit')} to leave.`);
    Formatter.spacer();

    this.prompt();
  }

  private prompt(): void {
    this.rl.question(colors.primary('> You: '), async input => {
      const trimmed = input.trim();

      if (!trimmed) {
        this.prompt();
        return;
      }

      if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
        Formatter.spacer();
        Formatter.success('Goodbye!');
        this.rl.close();
        process.exit(0);
      }

      if (trimmed.toLowerCase() === 'help') {
        this.showHelp();
        this.prompt();
        return;
      }

      try {
        spinner.start('Thinking...');
        const response = await askAI(trimmed);
        spinner.succeed();
        Formatter.spacer();

        console.log(colors.bold('DevAssist:'));
        Formatter.printWrapped(response);
        Formatter.spacer();
      } catch (err) {
        spinner.fail();
        Formatter.error(err instanceof Error ? err.message : 'An error occurred');
        Formatter.spacer();
      }

      this.prompt();
    });
  }

  private showHelp(): void {
    Formatter.spacer();
    Formatter.section('HELP');
    Formatter.text(`Ask anything about your code, errors, or project structure.`);
    Formatter.text(`Type ${colors.primary('exit')} to quit.`);
    Formatter.spacer();
  }
}

export async function startREPL(): Promise<void> {
  const repl = new REPL();
  await repl.start();
}
