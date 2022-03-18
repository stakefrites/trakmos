import React, { useState, useEffect } from "react";
import { Row, Col, Card, Spinner, Badge, Button } from "react-bootstrap";
import Base from "../modules/Base";
import NetworkProvider from "../NetworkProvider";
import LoadingToast from "../modules/LoadingToast";
import Network from "../../utils/Network.mjs";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import currency from "currency.js";
import _ from "lodash";
import NetworkProvider from "../NetworkProvider";
import PricesProvider from "../PricesProvider";

const Single = (props) => {
  const [network, setNetwork] = useState(false);
  const [balance, setBalance] = useState(false);
  const [isNetworkLoading, setIsNetworkLoading] = useState(true);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);

  const navigate = useNavigate();
  const params = useParams();
  const { state } = useLocation();

  const changeNetwork = (network) => {
    setNetwork(network);
    setIsNetworkLoading(false);
  };

  const getBalance = async (address, network) => {
    setIsBalanceLoading(true);

    try {
      const balance = await network.queryClient.getSingleBalance(
        address,
        network
      );
      console.log(balance);
      setBalance(balance);
      setIsBalanceLoading(false);
      return balance;
    } catch (e) {
      console.log(e);
      return;
    }
  };

  useEffect(() => {
    console.log(props, state);
    if (props.networks && !network) {
      const networkName = params.network || props.networks[0];
      const currentNetwork = props.networks.find(
        (el) => el.name === params.network
      );
      getBalance(state.address, currentNetwork);
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
      <LoadingToast element={"network"} isLoading={props.isNetworkLoading} />

      <Base>
        <>
          <Row>
            <Col>
              <h1 className="mb-5">
                {params.network
                  ? params.network.charAt(0).toUpperCase() +
                    params.network.slice(1)
                  : network.name.charAt(0).toUpperCase() +
                    network.name.slice(1)}
              </h1>
              {props.networks && balance ? (
                <img
                  src={_.keyBy(props.networks, "name")[balance.name].image}
                  height="100"
                  width="100"
                />
              ) : (
                ""
              )}
            </Col>
            <Col>
              <Badge>
                {props.prices && network ? (
                  <strong>
                    {currency(props.prices[network.coingecko_id]?.price, {
                      precision: 3,
                    }).format()}
                  </strong>
                ) : (
                  <Spinner
                    className="mx-1"
                    size="sm"
                    animation="border"
                    role="status"
                  ></Spinner>
                )}
              </Badge>
            </Col>
          </Row>
          <Row>
            <Col>
              <Card>
                <Card.Body>
                  <Row>
                    <Col>
                      <h3>Your holdings</h3>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      {isBalanceLoading ? (
                        <Spinner
                          className="mx-1"
                          size="sm"
                          animation="border"
                          role="status"
                        ></Spinner>
                      ) : (
                        <>
                          <p>
                            <strong>Liquid:</strong> {balance.liquid}{" "}
                          </p>
                          <p>
                            <strong>Rewards:</strong>
                            {balance.rewards}{" "}
                          </p>
                          <p>
                            <strong>Staked:</strong> {balance.staked}
                          </p>
                        </>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row>
            <Col>
              <Button
                onClick={() => {
                  navigate("/stake/" + params.network);
                }}
              >
                Re-Stake
              </Button>
            </Col>
          </Row>
        </>
      </Base>
    </>
  );
};

export default (
  <NetworkProvider>
    <PricesProvider>
      <Network />
    </PricesProvider>
  </NetworkProvider>
);
