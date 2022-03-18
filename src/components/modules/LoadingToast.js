import React from "react";
import { ToastContainer, Toast, Spinner } from "react-bootstrap";

export default LoadingToast = ({ isLoading, element }) => {
  return (
    <ToastContainer className="p-3 toaster" position={"top-end"}>
      <Toast show={isLoading} animation={true}>
        <Toast.Header closeButton={false}>
          <strong className="me-auto">Loading {element}</strong>

          <Spinner
            className="mx-1"
            size="sm"
            animation="border"
            role="status"
          ></Spinner>
        </Toast.Header>
      </Toast>
    </ToastContainer>
  );
};
