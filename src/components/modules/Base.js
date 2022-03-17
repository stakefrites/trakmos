import React, { useState } from "react";
import { Container } from "react-bootstrap";
import Header from "./Header";
import Footer from "./Footer";
import About from "./About";

const Base = (props) => {
  const [showAbout, setShowAbout] = useState(false);
  return (
    <>
      <Container>
        <Header address={props.address} />
        {props.children}
        <Footer />
        <About show={showAbout} onHide={() => setShowAbout(false)} />
      </Container>
    </>
  );
};

export default Base;
