export class Spinner {
  private timer: NodeJS.Timeout | null = null;
  private text = '';
  private idx = 0;
  private readonly frames = ['-', '\\', '|', '/'];

  start(message = 'Processing...'): void {
    this.text = message;
    if (!process.stderr.isTTY) return;

    if (this.timer) {
      this.update(message);
      return;
    }

    this.timer = setInterval(() => {
      const frame = this.frames[this.idx];
      this.idx = (this.idx + 1) % this.frames.length;
      process.stderr.write(`\r${frame} ${this.text}`);
    }, 80);
  }

  succeed(message?: string): void {
    this.finish(message ?? this.text, '[OK]');
  }

  fail(message?: string): void {
    this.finish(message ?? this.text, '[ERROR]');
  }

  warn(message?: string): void {
    this.finish(message ?? this.text, '[WARN]');
  }

  stop(): void {
    if (!process.stderr.isTTY) return;
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    process.stderr.write('\r\x1b[2K');
  }

  update(message: string): void {
    this.text = message;
  }

  private finish(message: string, prefix: string): void {
    this.stop();
    if (message && process.stderr.isTTY) {
      process.stderr.write(`${prefix} ${message}\n`);
    }
  }
}

export const spinner = new Spinner();
