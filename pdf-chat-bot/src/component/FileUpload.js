import React from "react";

function FileUpload({
  file,
  loadingPdf,
  saveFile,
  handleFileChange,
  handleUpload,
}) {
  return (
    <div className="container-1">
      <h1 className="title">ADD HERE YOUR PDF FILE :</h1>
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      <button disabled={!file || loadingPdf} onClick={() => handleUpload(0)}>
        Upload your PDF
      </button>
      <h2>or</h2>
      <button onClick={() => handleUpload(1)}>
        Click here to upload a default PDF about 7/10
      </button>
      {loadingPdf ? (
        <div>
          <div className="spinner"></div>
          <h1 className="title">THE UPLOAD CAN TAKE A FEW MINUTES</h1>
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
  );
}

export default FileUpload;
