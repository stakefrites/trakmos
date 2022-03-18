import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Button,
  ListGroup,
  Badge,
  Badge,
  Stack,
  Table,
  Row,
  Col,
} from "react-bootstrap";
import currency from "currency.js";
import _ from "lodash";

const Result = (props) => {
  const navigate = useNavigate();
  const params = useParams();
  let totalValue = 0;

  if (props.balances !== undefined && props.balances) {
    const realBalances = props.balances.map((balance) => {
      if (
        props.prices[balance.coingecko_id] !== undefined &&
        props.prices[balance.coingecko_id].price !== undefined
      ) {
        const thisPrice = props.prices[balance.coingecko_id].price;
        /*  props.prices[balance.coingecko_id] !== undefined
            ? props.prices[balance.coingecko_id].price
            : 0; */
        totalValue += balance.total * thisPrice;
        return {
          ...balance,
          price: thisPrice,
          value: balance.total * thisPrice,
        };
      } else {
        return {
          ...balance,
          price: 0,
          value: balance.total * 0,
        };
      }
    });

    // ADD ON TR
    // navigate("/" + bal.name);

    /*
 <td>
                            {currency(bal.price, { precision: 3 }).format()}
                          </td>
                          <td width="auto">
                            <img
                              src={
                                _.keyBy(props.networks, "name")[bal.name].image
                              }
                              height="30"
                              width="30"
                            />
                          </td>
                          <td>{bal.liquid}</td>
                          <td>{bal.staked}</td>
                          <td>{bal.rewards.toFixed(2)}</td>
                          <td>{bal.total.toFixed(2)}</td>
                          <td>{currency(bal.value).format()}</td>
    */
    return (
      <>
        <Container fluid>
          <Row>
            <Col>
              <h2 className="mb-4 text-center total-value">
                {currency(totalValue).format()}
              </h2>
            </Col>
          </Row>

          <div className="col-12 mb-5">
            <ListGroup as="ol">
              {realBalances.map((bal) => {
                if (bal.total > 0) {
                  return (
                    <ListGroup.Item
                      key={bal.name}
                      onClick={() => {
                        navigate("/" + bal.name + "/network", {
                          state: {
                            address: props.address,
                            balances: props.balances,
                          },
                        });
                      }}
                      as="li"
                      className="d-flex justify-content-between align-items-start"
                    >
                      <div>
                        <Badge pill bg="dark">
                          <img
                            src={
                              _.keyBy(props.networks, "name")[bal.name].image
                            }
                            height="30"
                            width="30"
                          />
                        </Badge>
                      </div>
                      <div className="ms-2 me-auto">
                        <div className="fw-bold">{bal.name}</div>
                      </div>
                      <p>{currency(bal.value, { precision: 3 }).format()}</p>
                    </ListGroup.Item>
                  );
                }
              })}
            </ListGroup>
          </div>
          <Row>
            <Col>
              <Row>
                <h2 className="mb-5 support">We also support these chains</h2>
              </Row>
              <Row sm={4} className="mb-5">
                {realBalances.map((bal, i) => {
                  if (bal.total === 0) {
                    return (
                      <Col className="mb-5">
                        <div className="m-2 badger">
                          <Badge key={bal.name} pill bg="light">
                            <img
                              src={
                                _.keyBy(props.networks, "name")[bal.name].image
                              }
                              height="100"
                              width="100"
                            />
                          </Badge>
                        </div>
                      </Col>
                    );
                  }
                })}
              </Row>
            </Col>
          </Row>
        </Container>
      </>
    );
  }
  return <div>No balances</div>;
};
export default Result;
