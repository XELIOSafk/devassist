import { commands } from '../commands';

export class DevAssist {
  run(argv: string[]): void {
    const [commandName = 'help', ...args] = argv;
    const command = commands[commandName] ?? commands.help;

    if (!commands[commandName]) {
      console.error(`Unknown command: ${commandName}`);
      commands.help.execute([]);
      return;
    }

    command.execute(args);
  }
}
