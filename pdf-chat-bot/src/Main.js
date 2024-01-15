import React, { useState } from "react";
import axios from "axios";

function Main() {
  const [userQuestion, setUserQuestion] = useState("");
  const [pdfDocs, setPdfDocs] = useState(null);

  const handleUserInput = async () => {
    const formData = new FormData();
    formData.append("user_question", userQuestion);
    pdfDocs.forEach((pdf) => formData.append("pdf_docs[]", pdf));

    try {
      const response = await axios.post(
        "http://localhost:5000/process",
        formData
      );
      console.log(response.data);
      // Handle the response as needed
    } catch (error) {
      console.error("Error processing:", error);
    }
  };

  return (
    <div>
      <h1>Chat with multiple PDFs :books:</h1>
      <input
        type="text"
        value={userQuestion}
        onChange={(e) => setUserQuestion(e.target.value)}
      />
      <input
        type="file"
        multiple
        onChange={(e) => setPdfDocs(e.target.files)}
      />
      <button onClick={handleUserInput}>Process</button>
    </div>
  );
}

export default Main;
