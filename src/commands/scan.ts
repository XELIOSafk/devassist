import { Command } from './command';
import { scanProject } from '../core/scanner';

export class ScanCommand implements Command {
  name = 'scan';
  description = 'Scan the current project for code and configuration issues';
  usage = 'devassist scan';

  async execute(): Promise<void> {
    const cwd = process.cwd();
    console.log('Scanning project workspace...');

    try {
      const report = await scanProject(cwd, { maxEntries: 20000 });
      console.log(JSON.stringify(report, null, 2));
    } catch (err) {
      console.error('Failed to scan project:', err instanceof Error ? err.message : String(err));
    }
  }
}
