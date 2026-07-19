// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "./vendor/Ownable.sol";
import {Pausable} from "./vendor/Pausable.sol";
import {ReentrancyGuard} from "./vendor/ReentrancyGuard.sol";

import {GSLErrors} from "./errors/GSLErrors.sol";
import {IGSLEvents} from "./interfaces/IGSLEvents.sol";

/// @title GasSponsorLedger
/// @notice Decentralized MON gas sponsorship vault for Monad onboarding.
/// @dev Sponsors deposit native MON. Eligible wallets claim once up to `maxClaimAmount`.
///      Follows Checks-Effects-Interactions. Uses low-level `call` for native transfers.
contract GasSponsorLedger is Ownable, Pausable, ReentrancyGuard, IGSLEvents {
    /// @notice Maximum MON a single wallet may claim (wei).
    uint256 public maxClaimAmount;

    /// @notice Native MON held for sponsorship claims.
    uint256 public treasuryBalance;

    /// @notice Tracks whether an address has already claimed.
    mapping(address => bool) public hasClaimed;

    /// @notice Aggregate MON deposited by sponsors.
    uint256 public totalSponsored;

    /// @notice Aggregate MON claimed by users.
    uint256 public totalClaimed;

    /// @notice Number of unique wallets that successfully claimed.
    uint256 public usersHelped;

    /// @notice Number of distinct deposit transactions.
    uint256 public depositCount;

    constructor(address initialOwner, uint256 initialMaxClaim) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert GSLErrors.ZeroAddress();
        if (initialMaxClaim == 0) revert GSLErrors.InvalidMaxClaim();
        maxClaimAmount = initialMaxClaim;
    }

    /// @notice Sponsor deposits native MON into the treasury.
    function deposit() external payable whenNotPaused nonReentrant {
        if (msg.value == 0) revert GSLErrors.ZeroAmount();

        treasuryBalance += msg.value;
        totalSponsored += msg.value;
        unchecked {
            ++depositCount;
        }

        emit SponsorDeposited(msg.sender, msg.value, treasuryBalance);
    }

    /// @notice Claim sponsored gas once per wallet.
    function claim() external whenNotPaused nonReentrant {
        if (hasClaimed[msg.sender]) revert GSLErrors.AlreadyClaimed();
        if (treasuryBalance < maxClaimAmount) revert GSLErrors.InsufficientTreasury();

        uint256 amount = maxClaimAmount;

        // Effects
        hasClaimed[msg.sender] = true;
        treasuryBalance -= amount;
        totalClaimed += amount;
        unchecked {
            ++usersHelped;
        }

        // Interactions
        _safeSend(msg.sender, amount);

        emit GasClaimed(msg.sender, amount, treasuryBalance);
    }

    /// @notice Owner withdraws MON from the treasury (operational).
    function withdrawTreasury(address to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0)) revert GSLErrors.ZeroAddress();
        if (amount == 0) revert GSLErrors.ZeroAmount();
        if (amount > treasuryBalance) revert GSLErrors.InsufficientTreasury();

        treasuryBalance -= amount;
        _safeSend(to, amount);

        emit TreasuryWithdrawn(to, amount, treasuryBalance);
    }

    /// @notice Owner drains full contract balance while paused (emergency).
    function emergencyWithdraw(address to) external onlyOwner whenPaused nonReentrant {
        if (to == address(0)) revert GSLErrors.ZeroAddress();

        uint256 amount = address(this).balance;
        if (amount == 0) revert GSLErrors.ZeroAmount();

        treasuryBalance = 0;
        _safeSend(to, amount);

        emit EmergencyWithdraw(to, amount);
    }

    /// @notice Update the per-wallet claim cap.
    function setMaxClaimAmount(uint256 newMax) external onlyOwner {
        if (newMax == 0) revert GSLErrors.InvalidMaxClaim();
        uint256 old = maxClaimAmount;
        maxClaimAmount = newMax;
        emit MaxClaimUpdated(old, newMax);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Eligibility helper for frontends.
    function canClaim(address account) external view returns (bool) {
        return !hasClaimed[account] && treasuryBalance >= maxClaimAmount && !paused();
    }

    /// @notice Snapshot of ledger metrics for dashboards.
    function getStats()
        external
        view
        returns (
            uint256 _treasuryBalance,
            uint256 _maxClaimAmount,
            uint256 _totalSponsored,
            uint256 _totalClaimed,
            uint256 _usersHelped,
            uint256 _depositCount,
            bool _paused
        )
    {
        return (
            treasuryBalance,
            maxClaimAmount,
            totalSponsored,
            totalClaimed,
            usersHelped,
            depositCount,
            paused()
        );
    }

    function _safeSend(address to, uint256 amount) private {
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert GSLErrors.TransferFailed();
    }

    receive() external payable {
        if (msg.value == 0) revert GSLErrors.ZeroAmount();
        treasuryBalance += msg.value;
        totalSponsored += msg.value;
        unchecked {
            ++depositCount;
        }
        emit SponsorDeposited(msg.sender, msg.value, treasuryBalance);
    }
}
