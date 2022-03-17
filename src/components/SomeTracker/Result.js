import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Button,
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

          <hr />
          <div className="col-12 mt-3">
            <Table responsive bordered size="md" variant="dark">
              <thead>
                <tr>
                  <th>Price</th>
                  <th>Chain</th>
                  <th>Balance</th>
                  <th>Delegated</th>
                  <th>Rewards</th>
                  <th>Total</th>
                  <th>Value (in USD)</th>
                </tr>
              </thead>
              <tbody>
                {realBalances.map((bal) => {
                  if (bal.total > 0) {
                    return (
                      <tr key={bal.name} onClick={() => {}}>
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
                      </tr>
                    );
                  }
                })}
              </tbody>
            </Table>
          </div>
          <hr />
          <Row>
            <Col>
              <h3 className="mb-3">We also support these chains</h3>
              <Row sm={4}>
                {realBalances.map((bal, i) => {
                  if (bal.total === 0) {
                    return (
                      <Col>
                        <div className="m-2 badger">
                          <Badge key={bal.name} pill bg="light">
                            <img
                              src={
                                _.keyBy(props.networks, "name")[bal.name].image
                              }
                              height="35"
                              width="35"
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
