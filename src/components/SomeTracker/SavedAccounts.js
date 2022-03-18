import React from "react";
import { Button, DropdownButton, Dropdown } from "react-bootstrap";
const resizeAddress = (address) => {
  const prefix = address.slice(0, 8);
  const suffix = address.slice(address.length - 8);
  return prefix + "..." + suffix;
};

const SavedAccounts = (props) => {
  return (
    <div>
      {Array.isArray(props.accounts) ? (
        <div>
          <DropdownButton
            className="mt-3"
            size="sm"
            title="Saved Accounts"
            variant="dark"
          >
            {props.accounts?.map((account, i) => {
              return (
                <Dropdown.Item
                  variant="outline-dark"
                  onClick={() => {
                    props.setAddress(account);
                  }}
                  eventKey={i}
                  key={i}
                >
                  {resizeAddress(account)}
                </Dropdown.Item>
              );
            })}
            <Dropdown.Item
              variant="outline-dark"
              onClick={() => {
                props.setAddress(false);
              }}
              key={"100"}
              eventKey="100"
            >
              Add an account
            </Dropdown.Item>
          </DropdownButton>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

export default SavedAccounts;
