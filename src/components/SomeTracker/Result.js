import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Button, Badge, Stack, Table } from "react-bootstrap";
import currency from "currency.js";
import { CashStack } from "react-bootstrap-icons";
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
          <div className="col-12" align="right">
            <button className="btn btn-outline-dark total-box disabled">
              <CashStack className="total-box-button" size={20} />
              <span>
                <b>Total:</b> {currency(totalValue).format()}
              </span>
            </button>
          </div>
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
          <div>
            <h3>We also support these chains</h3>
            <Stack direction="horizontal" gap={1}>
              {realBalances.map((bal) => {
                if (bal.total === 0) {
                  return (
                    <>
                      <Badge key={bal.name} bg="dark">
                        {bal.name}
                      </Badge>
                    </>
                  );
                }
              })}
            </Stack>
          </div>
        </Container>
      </>
    );
  }
  return <div>No balances</div>;
};
export default Result;
