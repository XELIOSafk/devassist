import { Command } from './command';
import { ErrorCommand } from './error';
import { ExplainCommand } from './explain';
import { HelpCommand } from './help';
import { ScanCommand } from './scan';

const commandSet: Record<string, Command> = {};

commandSet.error = new ErrorCommand();
commandSet.explain = new ExplainCommand();
commandSet.scan = new ScanCommand();
commandSet.help = new HelpCommand(commandSet);

export const commands = commandSet;
