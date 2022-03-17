import React from "react";
import { ToastContainer, Toast, Spinner } from "react-bootstrap";

export default LoadingToast = ({ isLoading, element }) => {
  return (
    <ToastContainer className="p-3" position={"top-end"}>
      <Toast show={isLoading} animation={true}>
        <Toast.Header closeButton={false}>
          <img className="rounded me-2" alt="" />
          <strong className="me-auto">Loading {element}</strong>
          <Spinner animation="border" role="status"></Spinner>
        </Toast.Header>
      </Toast>
    </ToastContainer>
  );
};
