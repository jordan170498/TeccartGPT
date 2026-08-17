const ChatInput = ({ draft, isDisabled, onDraftChange, onSendMessage }) => {
  const canSend = draft.trim().length > 0 && !isDisabled;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSendMessage();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSendMessage();
    }
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <textarea
        aria-label="Message"
        disabled={isDisabled}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ecrivez a TeccartGPT..."
        rows="1"
        value={draft}
      />
      <button type="submit" disabled={!canSend}>
        {isDisabled ? 'Patientez' : 'Envoyer'}
      </button>
    </form>
  );
};

export default ChatInput;
