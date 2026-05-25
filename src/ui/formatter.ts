import { colors, icons } from './colors';

export class Formatter {
  static title(text: string): void {
    console.log(colors.primary(colors.bold(`\n${icons.arrow} ${text}`)));
  }

  static section(title: string, color: 'primary' | 'success' | 'warning' | 'error' = 'primary'): void {
    const colorFn = colors[color];
    console.log(colors.bold(colorFn(`${title}:`)));
  }

  static text(text: string): void {
    console.log(text);
  }

  static code(code: string, language = ''): void {
    const lines = code.split('\n');
    const indent = '  ';
    console.log(colors.muted('```' + language));
    lines.forEach(line => console.log(indent + line));
    console.log(colors.muted('```'));
  }

  static success(message: string): void {
    console.log(colors.success(`${icons.check} ${message}`));
  }

  static error(message: string): void {
    console.log(colors.error(`${icons.cross} ${message}`));
  }

  static warning(message: string): void {
    console.log(colors.warning(`${icons.warn} ${message}`));
  }

  static info(message: string): void {
    console.log(colors.muted(`${icons.info} ${message}`));
  }

  static step(number: number, description: string): void {
    console.log(colors.bold(`${number}. ${description}`));
  }

  static dimText(text: string): void {
    console.log(colors.muted(text));
  }

  static wrap(text: string, width = 88): string[] {
    if (!text) return [];
    const paragraphs = text.split(/\n\s*\n/);
    const lines: string[] = [];

    for (const p of paragraphs) {
      const words = p.replace(/\s+/g, ' ').trim().split(' ');
      let line = '';

      for (const w of words) {
        if ((line + ' ' + w).trim().length > width) {
          if (line) lines.push(line.trim());
          line = w;
        } else {
          line += (line ? ' ' : '') + w;
        }
      }

      if (line.trim()) lines.push(line.trim());
      lines.push('');
    }

    return lines;
  }

  static printWrapped(text: string, width = 88): void {
    this.wrap(text, width).forEach(line => console.log(line));
  }

  static list(items: string[]): void {
    items.forEach(item => console.log(colors.muted(`${icons.bullet} ${item}`)));
  }

  static keyValue(key: string, value: string): void {
    console.log(`${colors.bold(key)}: ${value}`);
  }

  static hr(): void {
    console.log(colors.muted('-'.repeat(88)));
  }

  static spacer(): void {
    console.log('');
  }

  static response(title: string, content: string): void {
    this.section(title);
    this.printWrapped(content);
    this.spacer();
  }
}

export default Formatter;
