import React from "react";
import { Login } from "./Login";
import { UserAddress } from "./UserAddress";

export function Header(): JSX.Element {
  return (
    <header className="mt-3 p-0 d-flex align-items-center justify-content-start container contract-container">
      <UserAddress />
      <Login />
    </header>
  );
}
