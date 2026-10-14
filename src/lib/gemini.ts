import { apiRequest } from './api';

export async function getChatResponse(message: string, history: { role: string; parts: { text: string }[] }[]) {
  const result = await apiRequest<{ text?: string }>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  });
  return result.text || '';
}
