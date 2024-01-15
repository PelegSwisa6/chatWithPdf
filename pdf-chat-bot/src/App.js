import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [userQuestion, setUserQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [file, setFile] = useState(null);
  const [saveFile, setSaveFile] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      setLoadingPdf(true);
      await axios.post(
        "https://chatwithpdf-flask-app.onrender.com/add-pdf",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("File uploaded successfully");
      setSaveFile(true);
    } catch (error) {
      console.error("Error uploading file:", error);
      setSaveFile(false);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleUserInput = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        "https://chatwithpdf-flask-app.onrender.com/chat",
        {
          question: userQuestion,
        }
      );

      const newMessage = response.data;

      setChatHistory((prevChatHistory) => [...prevChatHistory, newMessage]);
      setUserQuestion("");
    } catch (error) {
      console.error("Error fetching chat history:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-main">
      <div className="container-1">
        <h1 className="title">ADD HERE YOUR PDF'S FILES :</h1>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <button disabled={!file} onClick={handleUpload}>
          Upload
        </button>
        {loadingPdf ? (
          <div>
            <h1 className="title">LOADING.....</h1>
          </div>
        ) : saveFile ? (
          <h1 className="title">
            YOUR FILE UPDATED! <br /> ASK WHATEVER YOU WANT!
          </h1>
        ) : (
          <div>
            <h1 className="add-pdf">YOU HAVE NOT UPLOADED A DOCUMENT YET</h1>
          </div>
        )}
      </div>
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
          />
          <button onClick={handleUserInput} disabled={loading}>
            {loading ? "Loading..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
