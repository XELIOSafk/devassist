import fs from 'fs';
import path from 'path';
import { analyzeWithAI, AIContext, suggestFixForError } from '../core/ai';
import UI, { Spinner } from '../core/ui';
import { Command } from './command';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function printSection(title: string, content: string, type: 'info' | 'error' | 'success' = 'info') {
  UI.section(title, type);
  UI.printWrapped(content, 88);
}

export class ErrorCommand implements Command {
  name = 'error';
  description = 'Analyze an error file or log input';
  usage = 'devassist error <file_or_log>';

  async execute(args: string[]): Promise<void> {
    const target = args.join(' ').trim();
    if (!target) {
      console.error(`${ANSI.red}Error: Missing error log or file path.${ANSI.reset}`);
      console.log(`Usage: ${this.usage}`);
      return;
    }

    const context: AIContext = {
      projectRoot: process.cwd(),
    };

    const candidatePath = path.resolve(process.cwd(), target);
    const isFile = fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile();

    if (isFile) {
      // If the provided file is a source file, read it as context; otherwise treat as error log
      const ext = path.extname(candidatePath).toLowerCase();
      const codeExts = new Set(['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.cs']);
      const content = fs.readFileSync(candidatePath, 'utf8');

      if (codeExts.has(ext)) {
        context.filePath = candidatePath;
        context.fileContent = content;
        printSection('Source', `Loaded source file: ${candidatePath}`);
      } else {
        context.errorLog = content;
        printSection('Source', `Loaded error content from file: ${candidatePath}`);
      }
    } else {
      context.errorLog = target;
      printSection('Source', 'Using pasted error log from command arguments.');
    }

    // Try to detect file path and line in error log if not already set
    if (!context.filePath && context.errorLog) {
      const cwd = process.cwd();
      // Patterns like at /path/to/file:123:45 or at C:\path\to\file:123:45 or (file:line:col)
      const regex = /(?:at |\()?([A-Za-z0-9_:\/\\.\-]+\.[a-zA-Z0-9]+):(\d+):(\d+)(?:\))?/g;
      const m = regex.exec(context.errorLog);
      if (m) {
        const possible = m[1];
        const lineNum = parseInt(m[2], 10);
        const abs = path.isAbsolute(possible) ? possible : path.resolve(cwd, possible);
        if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
            context.filePath = abs;
            context.fileContent = fs.readFileSync(abs, 'utf8');
            // reduce to a relevant snippet around the line
            const lines = context.fileContent.split(/\r?\n/);
            const start = Math.max(0, lineNum - 6);
            const end = Math.min(lines.length, lineNum + 5);
            context.fileContent = lines.slice(start, end).join('\n');
            context.filePath = abs;
            printSection('Detected', `Found referenced source ${abs} (line ${lineNum}).`, 'info');
        }
      }
    }

    const spinner = new Spinner();
    spinner.start('Analyzing with AI...');
    try {
      const analysis = await analyzeWithAI(context);
      spinner.stop();
      printSection('What the error means', analysis.explanation);
      printSection('Why it happened', analysis.rootCause);
      printSection('Exact fix steps', analysis.fixSuggestion);

      // If we have a source file context, ask the AI for a code fix suggestion
      if (context.filePath && context.fileContent) {
        const lineMatch = context.errorLog ? (context.errorLog.match(/:(\d+):(\d+)/) ? Number(context.errorLog.match(/:(\d+):(\d+)/)![1]) : undefined) : undefined;
        const spinner2 = new Spinner();
        spinner2.start('Requesting code fix from AI...');
        const fix = await suggestFixForError({ errorLog: context.errorLog, filePath: context.filePath, fileSnippet: context.fileContent, line: lineMatch, projectRoot: context.projectRoot });
        spinner2.stop();

        printSection('Suggested corrected code', fix.correctedCode || '(no code suggested)', 'info');
        printSection('Fix explanation', fix.explanation || '(no explanation)', 'info');

        if (fix.correctedCode) {
          UI.section('Note', 'error');
          UI.printWrapped('DevAssist will NOT modify files automatically. Apply the following patch manually.', 88);
          if (fix.startLine !== undefined && fix.endLine !== undefined) {
            UI.printWrapped(`Patch target: ${fix.filePath ?? context.filePath} lines ${fix.startLine}-${fix.endLine}`, 88);
          } else {
            UI.printWrapped(`Patch target: ${fix.filePath ?? context.filePath} (replace suggested region shown above)`, 88);
          }
        }
      }
    } catch (err) {
      spinner.stop();
      UI.error('Failed to analyze error:');
      UI.error(err instanceof Error ? err.message : String(err));
    }
  }
}
