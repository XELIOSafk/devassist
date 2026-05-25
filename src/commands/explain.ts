import { Command } from './command';
import { scanProject } from '../core/scanner';
import { summarizeProject } from '../core/ai';
import UI, { Spinner } from '../core/ui';

function gatherStats(node: any, extCount: Map<string, number>): void {
  for (const f of node.files || []) {
    const idx = f.lastIndexOf('.');
    const ext = idx >= 0 ? f.slice(idx).toLowerCase() : '(noext)';
    extCount.set(ext, (extCount.get(ext) || 0) + 1);
  }
  for (const child of node.folders || []) gatherStats(child, extCount);
}

export class ExplainCommand implements Command {
  name = 'explain';
  description = 'Explain the project repository at a high level';
  usage = 'devassist explain'

  async execute(): Promise<void> {
    const cwd = process.cwd();
    UI.section('Gathering project snapshot (fast scan)...');

    try {
      const spinner = new Spinner();
      spinner.start('Scanning project...');
      const report = await scanProject(cwd, { maxEntries: 20000 });
      spinner.stop();

      // Build a token-efficient summary
      const topLevelFolders = (report.folderStructure.folders || []).map((f: any) => f.name);
      const keyFileNames = Object.keys(report.keyFiles || {});

      const pkg = (report.keyFiles['package.json'] as any) || undefined;
      const tsconfig = (report.keyFiles['tsconfig.json'] as any) || undefined;

      const extCount = new Map<string, number>();
      gatherStats(report.folderStructure, extCount);
      const extArray = Array.from(extCount.entries()).sort((a, b) => b[1] - a[1]);
      const topExt = extArray.slice(0, 10).map(([ext, count]) => `${ext}: ${count}`).join(', ');

      const packageSummary: Record<string, unknown> = {};
      if (pkg) {
        packageSummary.name = pkg.name;
        packageSummary.version = pkg.version;
        packageSummary.description = pkg.description;
        packageSummary.main = pkg.main;
        packageSummary.scripts = pkg.scripts ? Object.keys(pkg.scripts).slice(0, 10) : [];
        packageSummary.dependencies = pkg.dependencies ? Object.keys(pkg.dependencies).slice(0, 10) : [];
        packageSummary.devDependencies = pkg.devDependencies ? Object.keys(pkg.devDependencies).slice(0, 10) : [];
      }

      const tsconfigSummary = tsconfig && tsconfig.compilerOptions ? Object.keys(tsconfig.compilerOptions) : [];

      const summaryText = `Root: ${report.root}\nTop-level folders: ${topLevelFolders.join(', ')}\nEntry points: ${report.entryPoints.join(', ')}\nKey files: ${keyFileNames.join(', ')}\nPackage: ${JSON.stringify(packageSummary)}\nTSConfig keys: ${JSON.stringify(tsconfigSummary)}\nTop extensions: ${topExt}`;

      UI.section('Summary (sent to AI)');
      UI.printWrapped(summaryText, 88);

      const spinner2 = new Spinner();
      spinner2.start('Summarizing project with AI...');
      const aiResult = await summarizeProject(summaryText);
      spinner2.stop();

      UI.section('What this project does');
      UI.printWrapped(aiResult.projectDescription, 88);

      UI.section('Tech stack used');
      UI.printWrapped(aiResult.techStack, 88);

      UI.section('Architecture overview');
      UI.printWrapped(aiResult.architecture, 88);

      UI.section('Suggested improvements');
      UI.printWrapped(aiResult.improvements, 88);
    } catch (err) {
      UI.error('Failed to explain project:');
      UI.error(err instanceof Error ? err.message : String(err));
    }
  }
}
