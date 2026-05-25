import { Router, startREPL, helpCommand, askCommand, scanCommand, errorCommand, explainCommand, CommandRegistry } from './cli/index';

const commands: CommandRegistry = {
  help: helpCommand,
  ask: askCommand,
  scan: scanCommand,
  error: errorCommand,
  explain: explainCommand,
};

const router = new Router(commands);

export async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  // If no arguments, start interactive REPL
  if (argv.length === 0) {
    await startREPL();
    return;
  }

  // Otherwise, route the command
  await router.route(argv);
}
