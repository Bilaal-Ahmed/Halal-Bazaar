export async function getChatResponse(message: string, history: { role: string; parts: { text: string }[] }[]) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  const result = await response.json() as { text?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message || 'The assistant is unavailable.');
  return result.text || '';
}
