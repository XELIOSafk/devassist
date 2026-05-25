import { CommandHandler } from '../types';
import { Formatter, spinner } from '../../ui';
import { askAI } from '../../core/ai';

export const askCommand: CommandHandler = {
  name: 'ask',
  description: 'Ask DevAssist a question',
  usage: 'devassist ask <prompt>',

  async execute(args: string[]): Promise<void> {
    const prompt = args.join(' ').trim();

    if (!prompt) {
      Formatter.error('Please provide a question or prompt.');
      Formatter.dimText('Usage: devassist ask "your question here"');
      return;
    }

    Formatter.title(`Question: ${prompt}`);
    Formatter.spacer();

    try {
      spinner.start('Consulting AI...');
      const response = await askAI(prompt);
      spinner.succeed('Response received');
      Formatter.spacer();

      Formatter.section('RESPONSE');
      Formatter.printWrapped(response);
      Formatter.spacer();
    } catch (err) {
      spinner.fail();
      throw err;
    }
  },
};
