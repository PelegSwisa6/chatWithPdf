import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import Modal from "./component/Modal";
import FileUpload from "./component/FileUpload";
import ChatContainer from "./component/ChatContainer";
import { v4 as uuidv4 } from "uuid";

function App() {
  const [userQuestion, setUserQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [file, setFile] = useState(null);
  const [saveFile, setSaveFile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [userId, setUserId] = useState();

  useEffect(() => {
    const num = uuidv4();
    setUserId(num);
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth <= 767);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    const num = uuidv4();
    setUserId(num);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleUpload = async (val) => {
    try {
      const formData = new FormData();
      formData.append("user_id", userId);
      if (val === 1) {
        formData.append("default", 1);
      } else {
        formData.append("pdf", file);
      }

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
          user_id: userId,
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
      {!isSmallScreen ? (
        <FileUpload
          file={file}
          loadingPdf={loadingPdf}
          saveFile={saveFile}
          handleFileChange={handleFileChange}
          handleUpload={handleUpload}
        />
      ) : (
        <>
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <FileUpload
              file={file}
              loadingPdf={loadingPdf}
              saveFile={saveFile}
              handleFileChange={handleFileChange}
              handleUpload={handleUpload}
            />
          </Modal>
          <button onClick={handleOpenModal}>ADD HERE PDF</button>
        </>
      )}

      <ChatContainer
        chatHistory={chatHistory}
        userQuestion={userQuestion}
        loading={loading}
        loadingPdf={loadingPdf}
        handleUserInput={handleUserInput}
        setUserQuestion={(value) => setUserQuestion(value)}
      />
    </div>
  );
}

export default App;
