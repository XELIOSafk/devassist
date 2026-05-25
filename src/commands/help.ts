import { Command } from './command';

type CommandMap = Record<string, Command>;

export class HelpCommand implements Command {
  name = 'help';
  description = 'Show help for DevAssist commands';
  usage = 'devassist help';

  constructor(private readonly commands: CommandMap) {}

  execute(): void {
    console.log('DevAssist commands:');
    Object.values(this.commands).forEach(command => {
      console.log(`\n  ${command.usage}`);
      console.log(`    ${command.description}`);
    });
  }
}
