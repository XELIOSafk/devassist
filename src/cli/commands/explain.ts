import { CommandHandler } from '../types';
import { Formatter, spinner } from '../../ui';
import { scanProject } from '../../core/scanner';
import { askAI } from '../../core/ai';

export const explainCommand: CommandHandler = {
  name: 'explain',
  description: 'Explain your entire project',
  usage: 'devassist explain',

  async execute(): Promise<void> {
    const cwd = process.cwd();
    Formatter.title('Project Analysis');
    Formatter.spacer();

    try {
      spinner.start('Scanning project...');
      const report = await scanProject(cwd, { maxEntries: 20000 });
      spinner.update('Generating summary...');

      const topLevelFolders = (report.folderStructure.folders || [])
        .map((f: any) => f.name)
        .slice(0, 5);
      const keyFileNames = Object.keys(report.keyFiles || {});
      const pkg = (report.keyFiles['package.json'] as any) || {};

      const summaryText =
        `Project Root: ${report.root}\n` +
        `Main Folders: ${topLevelFolders.join(', ')}\n` +
        `Entry Points: ${report.entryPoints.slice(0, 3).join(', ')}\n` +
        `Package Name: ${pkg.name || 'N/A'}\n` +
        `Description: ${pkg.description || 'N/A'}\n` +
        `Key Technologies: ${keyFileNames.join(', ')}`;

      spinner.update('Asking AI...');
      const prompt =
        'Based on this project summary, provide a concise explanation:\n' +
        '1. What does this project do?\n' +
        '2. What is the tech stack?\n' +
        '3. What is the architecture?\n' +
        '4. What improvements could be made?\n\n' +
        `Summary:\n${summaryText}`;

      const response = await askAI(prompt);
      spinner.succeed('Analysis complete');
      Formatter.spacer();

      Formatter.section('PROJECT OVERVIEW');
      Formatter.printWrapped(response);
      Formatter.spacer();
    } catch (err) {
      spinner.fail();
      throw err;
    }
  },
};
