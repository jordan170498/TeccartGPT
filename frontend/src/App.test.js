import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

class MockWebSocket {
  close() {}
}

beforeEach(() => {
  global.WebSocket = MockWebSocket;
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ messages: [] }),
    })
  );
});

test('renders the conversation screen', async () => {
  render(<App />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('http://localhost:3002/messages'));
  expect(screen.getByRole('heading', { level: 1, name: /teccartgpt/i })).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/teccartgpt/i)).toBeInTheDocument();
});
