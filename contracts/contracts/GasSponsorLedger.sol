// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "./vendor/Ownable.sol";
import {Pausable} from "./vendor/Pausable.sol";
import {ReentrancyGuard} from "./vendor/ReentrancyGuard.sol";

import {
    ZeroAddress,
    ZeroAmount,
    AlreadyClaimed,
    InsufficientTreasury,
    InvalidMaxClaim,
    TransferFailed,
    NotRelayer
} from "./errors/GSLErrors.sol";
import {IGSLEvents} from "./interfaces/IGSLEvents.sol";

/// @title GasSponsorLedger
/// @notice Decentralized MON gas sponsorship vault for Monad onboarding.
/// @dev Sponsors deposit native MON. Eligible wallets claim once up to `maxClaimAmount`.
///      Follows Checks-Effects-Interactions. Uses low-level `call` for native transfers.
contract GasSponsorLedger is Ownable, Pausable, ReentrancyGuard, IGSLEvents {
    uint256 public maxClaimAmount;
    uint256 public treasuryBalance;
    mapping(address => bool) public hasClaimed;
    uint256 public totalSponsored;
    uint256 public totalClaimed;
    uint256 public usersHelped;
    uint256 public depositCount;

    /// @notice Authorized relayer that may claim on behalf of zero-balance wallets.
    address public relayer;

    constructor(address initialOwner, uint256 initialMaxClaim) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        if (initialMaxClaim == 0) revert InvalidMaxClaim();
        maxClaimAmount = initialMaxClaim;
        relayer = initialOwner;
        emit RelayerUpdated(address(0), initialOwner);
    }

    function deposit() external payable whenNotPaused nonReentrant {
        if (msg.value == 0) revert ZeroAmount();

        treasuryBalance += msg.value;
        totalSponsored += msg.value;
        unchecked {
            ++depositCount;
        }

        emit SponsorDeposited(msg.sender, msg.value, treasuryBalance);
    }

    function claim() external whenNotPaused nonReentrant {
        _claim(msg.sender);
    }

    /// @notice Gasless onboarding: the relayer pays gas, the recipient gets MON.
    /// @dev One-claim-per-wallet is enforced on the recipient, not the relayer,
    ///      so a zero-balance wallet can be onboarded without ever holding MON.
    function claimFor(address recipient) external whenNotPaused nonReentrant {
        if (msg.sender != relayer && msg.sender != owner()) revert NotRelayer();
        if (recipient == address(0)) revert ZeroAddress();
        _claim(recipient);
    }

    function setRelayer(address newRelayer) external onlyOwner {
        if (newRelayer == address(0)) revert ZeroAddress();
        address old = relayer;
        relayer = newRelayer;
        emit RelayerUpdated(old, newRelayer);
    }

    function _claim(address recipient) private {
        if (hasClaimed[recipient]) revert AlreadyClaimed();
        if (treasuryBalance < maxClaimAmount) revert InsufficientTreasury();

        uint256 amount = maxClaimAmount;

        hasClaimed[recipient] = true;
        treasuryBalance -= amount;
        totalClaimed += amount;
        unchecked {
            ++usersHelped;
        }

        _safeSend(recipient, amount);

        emit GasClaimed(recipient, amount, treasuryBalance);
    }

    function withdrawTreasury(address to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (amount > treasuryBalance) revert InsufficientTreasury();

        treasuryBalance -= amount;
        _safeSend(to, amount);

        emit TreasuryWithdrawn(to, amount, treasuryBalance);
    }

    function emergencyWithdraw(address to) external onlyOwner whenPaused nonReentrant {
        if (to == address(0)) revert ZeroAddress();

        uint256 amount = address(this).balance;
        if (amount == 0) revert ZeroAmount();

        treasuryBalance = 0;
        _safeSend(to, amount);

        emit EmergencyWithdraw(to, amount);
    }

    function setMaxClaimAmount(uint256 newMax) external onlyOwner {
        if (newMax == 0) revert InvalidMaxClaim();
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

    function canClaim(address account) external view returns (bool) {
        return !hasClaimed[account] && treasuryBalance >= maxClaimAmount && !paused();
    }

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
        if (!ok) revert TransferFailed();
    }

    receive() external payable {
        if (msg.value == 0) revert ZeroAmount();
        treasuryBalance += msg.value;
        totalSponsored += msg.value;
        unchecked {
            ++depositCount;
        }
        emit SponsorDeposited(msg.sender, msg.value, treasuryBalance);
    }
}
