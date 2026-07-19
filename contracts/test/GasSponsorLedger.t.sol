// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {GasSponsorLedger} from "../src/GasSponsorLedger.sol";
import {GSLErrors} from "../src/errors/GSLErrors.sol";
import {Ownable} from "../src/vendor/Ownable.sol";

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

contract GasSponsorLedgerTest is Test {
    GasSponsorLedger internal ledger;

    address internal owner = makeAddr("owner");
    address internal sponsor = makeAddr("sponsor");
    address internal user = makeAddr("user");
    address internal user2 = makeAddr("user2");

    uint256 internal constant MAX_CLAIM = 0.01 ether;

    function setUp() public {
        vm.prank(owner);
        ledger = new GasSponsorLedger(owner, MAX_CLAIM);

        vm.deal(sponsor, 100 ether);
        vm.deal(user, 0);
        vm.deal(user2, 0);
    }

    function test_DepositSuccess() public {
        vm.prank(sponsor);
        ledger.deposit{value: 1 ether}();

        assertEq(ledger.treasuryBalance(), 1 ether);
        assertEq(ledger.totalSponsored(), 1 ether);
        assertEq(ledger.depositCount(), 1);
    }

    function test_ClaimSuccess() public {
        vm.prank(sponsor);
        ledger.deposit{value: 1 ether}();

        vm.prank(user);
        ledger.claim();

        assertEq(user.balance, MAX_CLAIM);
        assertTrue(ledger.hasClaimed(user));
        assertEq(ledger.usersHelped(), 1);
        assertEq(ledger.treasuryBalance(), 1 ether - MAX_CLAIM);
    }

    function test_ClaimTwiceReverts() public {
        vm.prank(sponsor);
        ledger.deposit{value: 1 ether}();

        vm.startPrank(user);
        ledger.claim();
        vm.expectRevert(GSLErrors.AlreadyClaimed.selector);
        ledger.claim();
        vm.stopPrank();
    }

    function test_ClaimWithEmptyTreasuryReverts() public {
        vm.prank(user);
        vm.expectRevert(GSLErrors.InsufficientTreasury.selector);
        ledger.claim();
    }

    function test_UnauthorizedWithdrawReverts() public {
        vm.prank(sponsor);
        ledger.deposit{value: 1 ether}();

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        ledger.withdrawTreasury(user, 0.1 ether);
    }

    function test_PausedBlocksClaimAndDeposit() public {
        vm.prank(sponsor);
        ledger.deposit{value: 1 ether}();

        vm.prank(owner);
        ledger.pause();

        vm.prank(sponsor);
        vm.expectRevert();
        ledger.deposit{value: 0.1 ether}();

        vm.prank(user);
        vm.expectRevert();
        ledger.claim();
    }

    function test_EmergencyWithdraw() public {
        vm.prank(sponsor);
        ledger.deposit{value: 2 ether}();

        vm.prank(owner);
        ledger.pause();

        uint256 before = owner.balance;
        vm.prank(owner);
        ledger.emergencyWithdraw(owner);

        assertEq(owner.balance, before + 2 ether);
        assertEq(ledger.treasuryBalance(), 0);
        assertEq(address(ledger).balance, 0);
    }

    function test_ReentrancyAttackCannotDoubleClaim() public {
        vm.prank(sponsor);
        ledger.deposit{value: 1 ether}();

        ReentrancyAttacker attacker = new ReentrancyAttacker(ledger);
        attacker.arm();

        vm.prank(address(attacker));
        attacker.attackClaim();

        assertTrue(ledger.hasClaimed(address(attacker)));
        assertEq(address(attacker).balance, MAX_CLAIM);
        // Second nested claim must fail; treasury only reduced once
        assertEq(ledger.treasuryBalance(), 1 ether - MAX_CLAIM);
    }

    function test_SetMaxClaim() public {
        vm.prank(owner);
        ledger.setMaxClaimAmount(0.05 ether);
        assertEq(ledger.maxClaimAmount(), 0.05 ether);
    }

    function test_ReceiveFallbackDeposit() public {
        vm.prank(sponsor);
        (bool ok,) = address(ledger).call{value: 0.5 ether}("");
        assertTrue(ok);
        assertEq(ledger.treasuryBalance(), 0.5 ether);
    }

    function testFuzz_Deposit(uint96 amount) public {
        vm.assume(amount > 0);
        vm.deal(sponsor, amount);
        vm.prank(sponsor);
        ledger.deposit{value: amount}();
        assertEq(ledger.treasuryBalance(), amount);
    }

    function testFuzz_ClaimAfterFund(uint96 seed) public {
        uint256 fund = uint256(seed) % 10 ether + MAX_CLAIM;
        vm.deal(sponsor, fund);
        vm.prank(sponsor);
        ledger.deposit{value: fund}();

        address claimer = address(uint160(uint256(keccak256(abi.encode(seed)))));
        vm.assume(claimer != address(0) && claimer != address(ledger));
        vm.prank(claimer);
        ledger.claim();
        assertEq(claimer.balance, MAX_CLAIM);
        assertTrue(ledger.hasClaimed(claimer));
    }
}
