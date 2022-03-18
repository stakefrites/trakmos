import React, { useState, useEffect } from "react";
import { Row, Col, Card } from "react-bootstrap";
import Base from "../modules/Base";
import NetworkProvider from "../NetworkProvider";
import LoadingToast from "../modules/LoadingToast";
import Network from "../../utils/Network.mjs";
import { useParams, useNavigate } from "react-router-dom";

export default Single = (props) => {
  const [network, setNetwork] = useState(false);
  const [isNetworkLoading, setIsNetworkLoading] = useState(true);

  const navigate = useNavigate();
  const params = useParams();

  const changeNetwork = (network) => {
    setNetwork(network);
  };

  useEffect(() => {
    if (props.networks && !network) {
      const networkName = params.network || props.networks[0];
      const currentNetwork = props.networks.find(
        (el) => el.name === params.network
      );
      changeNetwork(currentNetwork);
      if (params.network && !currentNetwork) {
        //navigate("/" + props.networks[0]);
      }
      if (!currentNetwork) {
        setIsNetworkLoading(false);
        return;
      }
      if (!params.network) {
        navigate("/" + networkName);
      }
    }
  }, [props.networks, network, params.network, navigate]);

  return (
    <>
      <LoadingToast
        element={"network data"}
        isLoading={props.isNetworkLoading}
      />
      <LoadingToast element={"prices"} isLoading={props.isPricesLoading} />

      <Base>
        <>
          <Row>
            <Col>
              <h1>{network.name}</h1>
            </Col>
          </Row>
          <Row>
            <Col>
              <Card>
                <Card.Body>Price: {}</Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      </Base>
    </>
  );
};
