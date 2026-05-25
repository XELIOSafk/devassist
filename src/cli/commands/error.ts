import fs from 'fs';
import path from 'path';
import { CommandHandler } from '../types';
import { Formatter, spinner } from '../../ui';
import { analyzeWithAI, suggestFixForError, AIContext } from '../../core/ai';

const CODE_EXTENSIONS = new Set([
  '.c',
  '.cpp',
  '.cs',
  '.go',
  '.java',
  '.js',
  '.jsx',
  '.py',
  '.rs',
  '.ts',
  '.tsx',
]);

function snippetAroundLine(content: string, line: number, radius = 6): string {
  const lines = content.split(/\r?\n/);
  const start = Math.max(0, line - radius - 1);
  const end = Math.min(lines.length, line + radius);
  return lines.slice(start, end).join('\n');
}

function detectReferencedSource(errorContent: string, cwd: string): { filePath: string; line?: number; snippet: string } | null {
  const regex = /(?:at\s+|\()?([A-Za-z]:[\\/][^:\r\n]+|[./\\]?[A-Za-z0-9_.\\/-]+):(\d+):(\d+)(?:\))?/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(errorContent))) {
    const candidate = match[1];
    const line = Number(match[2]);
    const absolute = path.isAbsolute(candidate) ? candidate : path.resolve(cwd, candidate);

    if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) {
      const content = fs.readFileSync(absolute, 'utf8');
      return {
        filePath: absolute,
        line,
        snippet: snippetAroundLine(content, line),
      };
    }
  }

  return null;
}

export const errorCommand: CommandHandler = {
  name: 'error',
  description: 'Analyze an error and get fix suggestions',
  usage: 'devassist error <file|log>',

  async execute(args: string[]): Promise<void> {
    const target = args.join(' ').trim();

    if (!target) {
      Formatter.error('Please provide an error log or file path.');
      Formatter.dimText('Usage: devassist error <file> or devassist error "error message"');
      return;
    }

    Formatter.title('Error Analysis');
    Formatter.spacer();

    const cwd = process.cwd();
    const context: AIContext = { projectRoot: cwd };
    let sourceLine: number | undefined;

    const candidatePath = path.resolve(cwd, target);
    const isFile = fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile();

    if (isFile) {
      const content = fs.readFileSync(candidatePath, 'utf8');
      const extension = path.extname(candidatePath).toLowerCase();

      if (CODE_EXTENSIONS.has(extension)) {
        context.filePath = candidatePath;
        context.fileContent = content;
        Formatter.info(`Loaded source file: ${candidatePath}`);
      } else {
        context.errorLog = content;
        Formatter.info(`Loaded error log from: ${candidatePath}`);
      }
    } else {
      context.errorLog = target;
      Formatter.info('Analyzing provided error text');
    }

    if (context.errorLog && !context.filePath) {
      const detected = detectReferencedSource(context.errorLog, cwd);
      if (detected) {
        context.filePath = detected.filePath;
        context.fileContent = detected.snippet;
        sourceLine = detected.line;
        Formatter.info(`Detected referenced source: ${detected.filePath}${detected.line ? `:${detected.line}` : ''}`);
      }
    }

    Formatter.spacer();

    try {
      spinner.start('Analyzing error with AI...');
      const analysis = await analyzeWithAI(context);
      spinner.succeed('Analysis complete');
      Formatter.spacer();

      Formatter.section('WHAT THE ERROR MEANS');
      Formatter.printWrapped(analysis.explanation);
      Formatter.section('WHY IT HAPPENED');
      Formatter.printWrapped(analysis.rootCause);
      Formatter.section('EXACT FIX STEPS');
      Formatter.printWrapped(analysis.fixSuggestion);
      Formatter.spacer();

      if (context.filePath && context.fileContent) {
        spinner.start('Requesting code fix suggestion...');
        const fix = await suggestFixForError({
          errorLog: context.errorLog,
          filePath: context.filePath,
          fileSnippet: context.fileContent,
          line: sourceLine,
          projectRoot: context.projectRoot,
        });
        spinner.succeed('Fix suggestion ready');
        Formatter.spacer();
        Formatter.section('SUGGESTED CORRECTED CODE');
        Formatter.code(fix.correctedCode || '(no code suggested)');
        Formatter.section('FIX EXPLANATION');
        Formatter.printWrapped(fix.explanation || '(no explanation provided)');
        Formatter.spacer();
      }

      Formatter.warning('Always review suggested fixes before applying them');
    } catch (err) {
      spinner.fail();
      throw err;
    }
  },
};
