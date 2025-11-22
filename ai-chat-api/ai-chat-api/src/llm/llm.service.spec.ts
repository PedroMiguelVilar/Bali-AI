import axios from 'axios';
import { LlmService } from './llm.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LlmService', () => {
  let service: LlmService;

  beforeEach(() => {
    service = new LlmService();
    jest.clearAllMocks();
  });

  it('calls the LLM backend and returns structured content', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        message: { content: 'Hello!' },
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      },
    });

    const messages = [{ role: 'user' as const, content: 'Hi there' }];

    const result = await service.generate(messages, 'custom-model', 0.5, 200, [
      'Stop',
    ]);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      {
        model: 'custom-model',
        messages,
        temperature: 0.5,
        max_tokens: 200,
        stream: false,
        stop: ['Stop'],
      },
    );
    expect(result).toEqual({
      content: 'Hello!',
      model: 'custom-model',
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      },
    });
  });

  it('throws a user-friendly error when the backend fails', async () => {
    mockedAxios.post.mockRejectedValue(new Error('network down'));

    await expect(
      service.generate([{ role: 'user', content: 'fail please' }]),
    ).rejects.toThrow('LLM service failed to generate response.');
  });

  it('builds messages correctly in prompt and trims the response', async () => {
    const generateSpy = jest
      .spyOn(service, 'generate')
      .mockResolvedValue({ content: ' Answer ', model: 'chosen-model' });

    const result = await service.prompt('Question?', 'model-a', 'system text');

    expect(generateSpy).toHaveBeenCalledWith(
      [
        { role: 'system', content: 'system text' },
        { role: 'user', content: 'Question?' },
      ],
      'model-a',
    );
    expect(result).toBe('Answer');
  });

  it('parses and filters analyzed memories from JSON output', async () => {
    jest.spyOn(service, 'prompt').mockResolvedValue(
      `Here you go:
[
  {"type":"identity","key":"name","value":"I am Sam","confidence":0.8},
  {"type":"identity","key":"","value":"missing key","confidence":0.9},
  {"type":"habit","key":"exercise","value":"I run daily","confidence":0.4}
]
Thanks!`,
    );

    const results = await service.analyzeMemory('I am Sam and I run daily');

    expect(results).toEqual([
      { type: 'identity', key: 'name', value: 'I am Sam', confidence: 0.8 },
    ]);
  });

  it('returns an empty array when analyzed memory is not valid JSON', async () => {
    jest.spyOn(service, 'prompt').mockResolvedValue('Not JSON at all');

    const results = await service.analyzeMemory('random text');

    expect(results).toEqual([]);
  });

  it('forwards reviseMemory to prompt with the crafted prompt content', async () => {
    const promptSpy = jest
      .spyOn(service, 'prompt')
      .mockResolvedValue('Revised text');

    const result = await service.reviseMemory(
      'Original fact',
      'Actually different',
    );

    expect(promptSpy).toHaveBeenCalledWith(
      expect.stringContaining('Original fact'),
      undefined,
      expect.stringContaining('revising long-term memory'),
    );
    expect(result).toBe('Revised text');
  });
});
