import { DevAssist } from './core/app';

export function runCLI(): void {
  const assistant = new DevAssist();
  assistant.run(process.argv.slice(2));
}
