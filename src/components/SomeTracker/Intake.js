import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import Table from 'react-bootstrap/Table';

const balances = [
  {chainAddress:"osmo1ehxggtt9h424awu6g0s6u479m2sgwe4qf063ur",name:"osmosis",rewards:123,staked:1234,liquid:234,lp:"Coming Soon"},
  {chainAddress:"akash1ehxggtt9h424awu6g0s6u479m2sgwe4qv0yxnt",name:"akash",rewards:123,staked:1234,liquid:234,lp:"Coming Soon"}
]

const Intake = (props) => {
  return (
    <>
      <Container fluid>
        <div>
            <Table striped bordered hover responsive variant="dark">
              <thead>
                <tr>
                  <th>Chain</th>
                  <th>Address</th>
                  <th>Balance</th>
                  <th>Delegated</th>
                  <th>LP</th>
                  <th>Rewards</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                 {
                   balances.map((bal) => {
                     return (
                      <tr key={bal.address}>
                        <td width="auto"><img src={props.networks[bal.name].image} height="30" width="30"/></td>
                        <td>{bal.chainAddress}</td>
                        <td>{bal.liquid}</td>
                        <td>{bal.staked}</td>
                        <td>{bal.lp}</td>
                        <td>{bal.rewards}</td>
                        <td>{bal.liquid + bal.staked + bal.rewards}</td>
                      </tr>
                     )
                   })
                 }
              </tbody>
            </Table>
        </div>
      </Container>
    </>
  );
};
export default Intake;
