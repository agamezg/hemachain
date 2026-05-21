// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {Codes} from "../src/lib/Codes.sol";

contract CodesTest is Test {
    // ─── shelfLifeDays ─────────────────────────────────────────────────────

    function test_ShelfLifeDays_RBC() public pure {
        assertEq(Codes.shelfLifeDays(Codes.ComponentType.RBC), 42);
    }

    function test_ShelfLifeDays_FFP() public pure {
        assertEq(Codes.shelfLifeDays(Codes.ComponentType.FFP), 365);
    }

    function test_ShelfLifeDays_PLT() public pure {
        assertEq(Codes.shelfLifeDays(Codes.ComponentType.PLT), 5);
    }

    function test_ShelfLifeDays_CRYO() public pure {
        assertEq(Codes.shelfLifeDays(Codes.ComponentType.CRYO), 365);
    }

    function test_ShelfLifeDays_RevertsOnUnknown() public {
        vm.expectRevert(Codes.UnknownComponentType.selector);
        this.callShelfLife(Codes.ComponentType.Unknown);
    }

    /// @dev External wrapper so vm.expectRevert sees the revert frame.
    function callShelfLife(Codes.ComponentType c) external pure returns (uint16) {
        return Codes.shelfLifeDays(c);
    }

    // ─── expiryAt ──────────────────────────────────────────────────────────

    function test_ExpiryAt_RBC() public pure {
        uint256 produced = 1_700_000_000;
        assertEq(Codes.expiryAt(Codes.ComponentType.RBC, produced), produced + 42 days);
    }

    function test_ExpiryAt_PLT() public pure {
        uint256 produced = 1_700_000_000;
        assertEq(Codes.expiryAt(Codes.ComponentType.PLT, produced), produced + 5 days);
    }

    function test_ExpiryAt_FFP_OneYear() public pure {
        uint256 produced = 1_700_000_000;
        assertEq(Codes.expiryAt(Codes.ComponentType.FFP, produced), produced + 365 days);
    }

    // ─── isTempInRange — RBC (2–6 °C) ──────────────────────────────────────

    function test_IsTempInRange_RBC_Inside() public pure {
        assertTrue(Codes.isTempInRange(Codes.ComponentType.RBC, 4));
    }

    function test_IsTempInRange_RBC_AtMin() public pure {
        assertTrue(Codes.isTempInRange(Codes.ComponentType.RBC, 2));
    }

    function test_IsTempInRange_RBC_AtMax() public pure {
        assertTrue(Codes.isTempInRange(Codes.ComponentType.RBC, 6));
    }

    function test_IsTempInRange_RBC_BelowMin() public pure {
        assertFalse(Codes.isTempInRange(Codes.ComponentType.RBC, 1));
    }

    function test_IsTempInRange_RBC_AboveMax() public pure {
        assertFalse(Codes.isTempInRange(Codes.ComponentType.RBC, 7));
    }

    // ─── isTempInRange — FFP / CRYO (frozen) ───────────────────────────────

    function test_IsTempInRange_FFP_AtMax() public pure {
        assertTrue(Codes.isTempInRange(Codes.ComponentType.FFP, -18));
    }

    function test_IsTempInRange_FFP_WarmedToZero() public pure {
        assertFalse(Codes.isTempInRange(Codes.ComponentType.FFP, 0));
    }

    function test_IsTempInRange_CRYO_AtMin() public pure {
        assertTrue(Codes.isTempInRange(Codes.ComponentType.CRYO, -30));
    }

    // ─── isTempInRange — PLT (20–24 °C, room temperature) ──────────────────

    function test_IsTempInRange_PLT_Inside() public pure {
        assertTrue(Codes.isTempInRange(Codes.ComponentType.PLT, 22));
    }

    function test_IsTempInRange_PLT_Refrigerated() public pure {
        // Platelets stored at fridge temperature are an excursion.
        assertFalse(Codes.isTempInRange(Codes.ComponentType.PLT, 4));
    }

    function test_IsTempInRange_RevertsOnUnknown() public {
        vm.expectRevert(Codes.UnknownComponentType.selector);
        this.callIsTempInRange(Codes.ComponentType.Unknown, 4);
    }

    function callIsTempInRange(Codes.ComponentType c, int16 t) external pure returns (bool) {
        return Codes.isTempInRange(c, t);
    }

    // ─── isValidAboRh ──────────────────────────────────────────────────────

    function test_IsValidAboRh_AllEight() public pure {
        bytes8[8] memory codes = [
            Codes.ABO_A_POS,
            Codes.ABO_A_NEG,
            Codes.ABO_B_POS,
            Codes.ABO_B_NEG,
            Codes.ABO_AB_POS,
            Codes.ABO_AB_NEG,
            Codes.ABO_O_POS,
            Codes.ABO_O_NEG
        ];
        for (uint256 i = 0; i < codes.length; i++) {
            assertTrue(Codes.isValidAboRh(codes[i]));
        }
    }

    function test_IsValidAboRh_RejectsUnknown() public pure {
        assertFalse(Codes.isValidAboRh(bytes8("ZZ")));
        assertFalse(Codes.isValidAboRh(bytes8(0)));
    }

    function test_AboRhConstants_HaveAsciiBytes() public pure {
        assertEq(Codes.ABO_O_NEG, bytes8(bytes("O-")));
        assertEq(Codes.ABO_AB_POS, bytes8(bytes("AB+")));
    }
}
