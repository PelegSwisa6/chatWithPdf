import React from "react";
// import './Modal.css';

const Modal = ({ isOpen, onClose, children }) => {
  return (
    isOpen && (
      <div className="modal">
        <div className="modal-content">
          <span className="close-btn" onClick={onClose}>
            &times;
          </span>
          {children}
        </div>
      </div>
    )
  );
};

export default Modal;
