// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title FirstPayment
/// @notice Demo merchant checkout on Arc: pay with native USDC (gas = money).
/// @dev Receives msg.value (native USDC on Arc / native MON on Monad) and forwards
///      to `merchant`. Emits an auditable PaymentReceived event.
contract FirstPayment {
    error ZeroAddress();
    error ZeroAmount();
    error TransferFailed();

    address public immutable merchant;
    uint256 public totalPaid;
    uint256 public paymentCount;
    mapping(address => uint256) public paidBy;

    event PaymentReceived(
        address indexed payer,
        address indexed merchant,
        uint256 amount,
        string memo,
        uint256 indexed paymentId
    );

    constructor(address merchant_) {
        if (merchant_ == address(0)) revert ZeroAddress();
        merchant = merchant_;
    }

    /// @notice Pay the merchant with native gas token (USDC on Arc).
    function pay(string calldata memo) external payable {
        if (msg.value == 0) revert ZeroAmount();

        uint256 amount = msg.value;
        address payer = msg.sender;

        unchecked {
            ++paymentCount;
            totalPaid += amount;
            paidBy[payer] += amount;
        }

        uint256 id = paymentCount;
        emit PaymentReceived(payer, merchant, amount, memo, id);

        (bool ok, ) = merchant.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    function getStats()
        external
        view
        returns (address merchant_, uint256 totalPaid_, uint256 paymentCount_)
    {
        return (merchant, totalPaid, paymentCount);
    }
}
