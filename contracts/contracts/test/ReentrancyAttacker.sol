// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {GasSponsorLedger} from "../GasSponsorLedger.sol";

/// @dev Helper used only in Hardhat tests to attempt reentrant claim.
contract ReentrancyAttacker {
    GasSponsorLedger public immutable ledger;
    bool internal _attack;

    constructor(GasSponsorLedger ledger_) {
        ledger = ledger_;
    }

    function arm() external {
        _attack = true;
    }

    function attackClaim() external {
        ledger.claim();
    }

    receive() external payable {
        if (_attack) {
            _attack = false;
            try ledger.claim() {} catch {}
        }
    }
}
