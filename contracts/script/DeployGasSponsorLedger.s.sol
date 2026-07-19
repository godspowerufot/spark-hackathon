// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {GasSponsorLedger} from "../src/GasSponsorLedger.sol";

/// @notice Deploy GasSponsorLedger to Monad (or local Anvil).
contract DeployGasSponsorLedger is Script {
    /// @dev Default max claim = 0.01 MON
    uint256 public constant DEFAULT_MAX_CLAIM = 0.01 ether;

    function run() external {
        address deployer = msg.sender;
        uint256 maxClaim = vm.envOr("MAX_CLAIM_WEI", DEFAULT_MAX_CLAIM);

        vm.startBroadcast();
        GasSponsorLedger ledger = new GasSponsorLedger(deployer, maxClaim);
        vm.stopBroadcast();

        console2.log("GasSponsorLedger deployed at:", address(ledger));
        console2.log("Owner:", deployer);
        console2.log("Max claim (wei):", maxClaim);
    }
}
