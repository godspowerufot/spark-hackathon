// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Gas Sponsor Ledger events
interface IGSLEvents {
    event SponsorDeposited(address indexed sponsor, uint256 amount, uint256 treasuryBalance);
    event GasClaimed(address indexed claimer, uint256 amount, uint256 treasuryBalance);
    event TreasuryWithdrawn(address indexed to, uint256 amount, uint256 treasuryBalance);
    event EmergencyWithdraw(address indexed to, uint256 amount);
    event MaxClaimUpdated(uint256 oldAmount, uint256 newAmount);
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
}
