import { useEffect, useRef } from 'react';
import Message from './Message';

const MessagesList = ({ messages }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  return (
    <div className="messages-list" aria-live="polite">
      {messages.length === 0 ? (
        <div className="empty-state">
          <h2>Bienvenue sur TeccartGPT</h2>
          <p>Posez votre premiere question.</p>
        </div>
      ) : (
        messages.map((message) => <Message key={message.id} message={message} />)
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessagesList;
