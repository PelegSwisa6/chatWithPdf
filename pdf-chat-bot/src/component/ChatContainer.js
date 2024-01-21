import React from "react";

function ChatContainer({
  chatHistory,
  userQuestion,
  loading,
  loadingPdf,
  handleUserInput,
  setUserQuestion,
}) {
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleUserInput();
    }
  };

  return (
    <div className="contianer-2">
      <h1 className="title">CHAT ABOUT YOUR INFO :</h1>
      <div className="chat-container">
        {chatHistory.map((message, index) => (
          <div key={index} className="chat-message">
            <div className={"user-bubble"}>{message.question}</div>
            <div className={"bot-bubble"}>{message.answer}</div>
          </div>
        ))}
      </div>
      <div className="question">
        <input
          type="text"
          placeholder="Ask a question about your documents"
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button onClick={handleUserInput} disabled={loading || loadingPdf}>
          {loading ? "Loading..." : "Submit"}
        </button>
      </div>
    </div>
  );
}

export default ChatContainer;
