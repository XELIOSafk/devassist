import { CommandHandler } from '../types';
import { Formatter, spinner } from '../../ui';
import { scanProject } from '../../core/scanner';

export const scanCommand: CommandHandler = {
  name: 'scan',
  description: 'Scan project structure',
  usage: 'devassist scan [--summary]',

  async execute(args: string[]): Promise<void> {
    const cwd = process.cwd();
    const summaryOnly = args.includes('--summary') || args.includes('-s');

    try {
      if (summaryOnly) {
        Formatter.title('Scanning project');
        Formatter.spacer();
        spinner.start('Reading project structure...');
      }

      const report = await scanProject(cwd, { maxEntries: 20000 });

      if (!summaryOnly) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      spinner.succeed('Scan complete');
      Formatter.spacer();
      Formatter.section('PROJECT STRUCTURE');
      Formatter.keyValue('Root', report.root);
      Formatter.keyValue('Entry Points', report.entryPoints.slice(0, 3).join(', ') || 'None detected');

      const topFolders = (report.folderStructure.folders || [])
        .map((f: any) => f.name)
        .slice(0, 8)
        .join(', ');
      Formatter.keyValue('Folders', topFolders || 'None');

      const keyFiles = Object.keys(report.keyFiles || {});
      Formatter.keyValue('Key Files', keyFiles.join(', ') || 'None');

      Formatter.spacer();
      Formatter.info('Run devassist scan for the full JSON report.');
      Formatter.spacer();
    } catch (err) {
      if (summaryOnly) spinner.fail();
      throw err;
    }
  },
};
