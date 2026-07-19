// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Gas Sponsor Ledger custom errors
library GSLErrors {
    error ZeroAddress();
    error ZeroAmount();
    error AlreadyClaimed();
    error InsufficientTreasury();
    error InvalidMaxClaim();
    error TransferFailed();
    error NotOwner();
}
