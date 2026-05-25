const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  green: '\x1b[32m',
};

export function section(title: string, color: 'info' | 'error' | 'success' = 'info') {
  const col = color === 'error' ? ANSI.red : color === 'success' ? ANSI.green : ANSI.cyan;
  console.log(`${col}${ANSI.bold}${title}${ANSI.reset}`);
}

export function info(msg: string) {
  console.log(msg);
}

export function error(msg: string) {
  console.error(`${ANSI.red}${msg}${ANSI.reset}`);
}

export function success(msg: string) {
  console.log(`${ANSI.green}${msg}${ANSI.reset}`);
}

export function printWrapped(text: string, width = 88) {
  if (!text) return;
  const paragraphs = String(text).split(/\n\s*\n/);
  for (const p of paragraphs) {
    const words = p.replace(/\s+/g, ' ').trim().split(' ');
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).trim().length > width) {
        console.log(line.trim());
        line = w + ' ';
      } else {
        line += w + ' ';
      }
    }
    if (line.trim()) console.log(line.trim());
    console.log('');
  }
}

export class Spinner {
  private timer: NodeJS.Timeout | null = null;
  private idx = 0;
  private frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  start(text = 'Processing') {
    if (this.timer) return;
    process.stdout.write('');
    this.timer = setInterval(() => {
      const frame = this.frames[this.idx = (this.idx + 1) % this.frames.length];
      process.stdout.write(`\r${frame} ${text}`);
    }, 80) as unknown as NodeJS.Timeout;
  }
  stop(finalText?: string) {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    process.stdout.write('\r');
    if (finalText) console.log(finalText);
  }
}

export default {
  section,
  info,
  error,
  success,
  printWrapped,
  Spinner,
};
