const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

function color(code: string): (text: string) => string {
  return (text: string) => `${code}${text}${ANSI.reset}`;
}

export const colors = {
  primary: color(ANSI.cyan),
  success: color(ANSI.green),
  warning: color(ANSI.yellow),
  error: color(ANSI.red),
  muted: color(ANSI.gray),
  bold: color(ANSI.bold),
  dim: color(ANSI.dim),
};

export const icons = {
  check: '[OK]',
  cross: '[ERROR]',
  arrow: '>',
  bullet: '-',
  info: '[INFO]',
  warn: '[WARN]',
};
