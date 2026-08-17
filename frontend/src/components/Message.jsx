const Message = ({ message }) => {
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';

  return (
    <article className={`message-row ${isUser ? 'from-user' : 'from-assistant'}`}>
      <div className={`message-bubble ${isError ? 'is-error' : ''}`}>
        <div className="message-meta">{isUser ? 'Vous' : 'TeccartGPT'}</div>
        <p className="message-content">
          {message.content || (isStreaming ? 'TeccartGPT reflechit...' : '')}
          {isStreaming && <span className="typing-caret" aria-hidden="true" />}
        </p>
      </div>
    </article>
  );
};

export default Message;
