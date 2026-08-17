import { useEffect, useRef, useState } from 'react';
import './App.css';
import MessagesList from './components/MessagesList';
import ChatInput from './components/ChatInput';

const API_URL = 'http://localhost:3002/generate';
const MESSAGES_URL = 'http://localhost:3002/messages';
const WS_URL = 'ws://localhost:3001';

const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const normalizeMessage = (message) => ({
  id: message.id || message._id || createMessageId(),
  role: message.role,
  content: message.content,
  status: 'done',
});

function App() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const activeAssistantId = useRef(null);
  const responseTimeout = useRef(null);
  const streamIdleTimer = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      try {
        const response = await fetch(MESSAGES_URL);

        if (!response.ok) {
          throw new Error('Messages could not be loaded.');
        }

        const data = await response.json();
        const persistedMessages = Array.isArray(data) ? data : data.messages || [];

        if (isMounted) {
          setMessages((currentMessages) =>
            currentMessages.length === 0 ? persistedMessages.map(normalizeMessage) : currentMessages
          );
        }
      } catch (error) {
        console.error('Failed to load persisted messages:', error);
      }
    };

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      const chunk = event.data;
      const assistantId = activeAssistantId.current || createMessageId();

      activeAssistantId.current = assistantId;
      setIsStreaming(true);
      window.clearTimeout(responseTimeout.current);

      setMessages((currentMessages) => {
        const existingIndex = currentMessages.findIndex((message) => message.id === assistantId);

        if (existingIndex === -1) {
          return [
            ...currentMessages,
            {
              id: assistantId,
              role: 'assistant',
              content: chunk,
              status: 'streaming',
            },
          ];
        }

        return currentMessages.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: `${message.content}${chunk}`,
                status: 'streaming',
              }
            : message
        );
      });

      window.clearTimeout(streamIdleTimer.current);
      streamIdleTimer.current = window.setTimeout(() => {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === assistantId ? { ...message, status: 'done' } : message
          )
        );
        activeAssistantId.current = null;
        setIsStreaming(false);
      }, 1200);
    };

    return () => {
      window.clearTimeout(responseTimeout.current);
      window.clearTimeout(streamIdleTimer.current);
      ws.close();
    };
  }, []);

  const handleSendMessage = async () => {
    const prompt = draft.trim();

    if (!prompt || isSending || isStreaming) {
      return;
    }

    if (!isConnected) {
      setDraft('');
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId(),
          role: 'user',
          content: prompt,
          status: 'done',
        },
        {
          id: createMessageId(),
          role: 'assistant',
          content: 'Impossible de recevoir la reponse: la connexion au flux est interrompue.',
          status: 'error',
        },
      ]);
      return;
    }

    const assistantId = createMessageId();
    activeAssistantId.current = assistantId;
    setDraft('');
    setIsSending(true);
    setIsStreaming(true);

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: createMessageId(),
        role: 'user',
        content: prompt,
        status: 'done',
      },
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        status: 'streaming',
      },
    ]);

    window.clearTimeout(responseTimeout.current);
    responseTimeout.current = window.setTimeout(() => {
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === assistantId && !message.content
            ? {
                ...message,
                content: 'Aucune reponse recue. Verifiez le service websocket et reessayez.',
                status: 'error',
              }
            : message
        )
      );

      if (activeAssistantId.current === assistantId) {
        activeAssistantId.current = null;
        setIsStreaming(false);
      }
    }, 600000);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
        }),
      });

      if (!response.ok) {
        throw new Error('The message could not be sent.');
      }
    } catch (error) {
      window.clearTimeout(responseTimeout.current);
      window.clearTimeout(streamIdleTimer.current);
      activeAssistantId.current = null;
      setIsStreaming(false);
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: 'Une erreur est survenue pendant l envoi du message.',
                status: 'error',
              }
            : message
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="App">
      <section className="chat-shell" aria-label="TeccartGPT conversation">
        <header className="chat-header">
          <div className="brand-lockup">
            <div className="brand-mark">
              <img src="/assets/teccart.jpg" alt="Logo Teccart" />
            </div>
            <div>
              <p className="chat-kicker">Assistant IA</p>
              <h1>TeccartGPT</h1>
            </div>
          </div>
          <span className={`connection-pill ${isConnected ? 'is-connected' : ''}`}>
            {isConnected ? 'En ligne' : 'Hors ligne'}
          </span>
        </header>

        <MessagesList messages={messages} />

        <ChatInput
          draft={draft}
          isDisabled={isSending || isStreaming}
          onDraftChange={setDraft}
          onSendMessage={handleSendMessage}
        />
      </section>
    </main>
  );
}

export default App;
