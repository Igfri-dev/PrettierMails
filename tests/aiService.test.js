import { describe, it, expect } from 'vitest';
import { generateEmailWithAi } from '../server/src/aiService.js';

describe('AI Service Fallback & Sanitization', () => {
  it('generates structured email fallback when no API key is provided', async () => {
    const result = await generateEmailWithAi({
      prompt: 'Crea un correo de bienvenida al equipo',
      videoLinks: ['https://www.youtube.com/watch?v=M7lc1UVf-VE'],
      imageLinks: ['https://example.com/logo.png'],
      provider: 'gemini',
      apiKey: null,
    });

    expect(result).toBeDefined();
    expect(result.subject).toContain('Bienvenido');
    expect(result.blocks).toBeInstanceOf(Array);
    expect(result.blocks.length).toBeGreaterThan(0);
    expect(result.isFallback).toBe(true);
    expect(result.generatedBy).toBe('local-fallback');

    // Verify all blocks have valid IDs and types
    result.blocks.forEach((block) => {
      expect(block.id).toBeDefined();
      expect(block.type).toBeDefined();
      expect(block.data).toBeDefined();
    });
  });

  it('rejects empty prompts', async () => {
    await expect(generateEmailWithAi({ prompt: '' })).rejects.toThrow('Por favor, ingresa una instrucción');
  });

  it('contains placeholders instead of hardcoded credentials in fallback', async () => {
    const result = await generateEmailWithAi({
      prompt: 'Onboarding y credenciales',
      apiKey: null,
    });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('usuario@novatech.io');
    expect(serialized).toContain('{{corporate_email}}');
  });
});
