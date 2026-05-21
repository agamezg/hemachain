// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {HemaRegistry} from "../../src/HemaRegistry.sol";
import {HemaTraceability} from "../../src/HemaTraceability.sol";
import {Codes} from "../../src/lib/Codes.sol";

/**
 * @title TraceabilityHandler
 * @notice Forge invariant handler. Drives valid sequences of state-changing
 *         calls against HemaTraceability and exposes ghost state the invariant
 *         tests can inspect.
 *
 *         Forge picks the public/external functions of this contract at random
 *         and fires them with fuzzed arguments. The handler is responsible for
 *         shaping arguments into valid ranges (`bound`) and for tracking
 *         unit/component identifiers as they're produced.
 */
contract TraceabilityHandler is Test {
    HemaRegistry public registry;
    HemaTraceability public trace;

    address public banco;
    address public lab;
    address public frac;

    bytes8 internal constant O_NEG = bytes8("O-");

    uint256[] public unitIds;
    uint256[] public componentIds;
    mapping(uint256 => bytes32) public donorAtFirstObservation;

    constructor(HemaRegistry registry_, HemaTraceability trace_, address banco_, address lab_, address frac_) {
        registry = registry_;
        trace = trace_;
        banco = banco_;
        lab = lab_;
        frac = frac_;
    }

    function registerDonation(uint16 volSeed, uint16 donorSeed) external {
        uint16 vol = uint16(bound(uint256(volSeed), 1, 600));
        bytes32 donor = keccak256(abi.encode(donorSeed));
        vm.prank(banco);
        try trace.registerDonation(donor, vol, O_NEG) returns (uint256 id) {
            unitIds.push(id);
            donorAtFirstObservation[id] = donor;
        } catch {}
    }

    function recordTestAndRelease(uint256 unitIdx) external {
        if (unitIds.length == 0) return;
        uint256 id = unitIds[bound(unitIdx, 0, unitIds.length - 1)];
        vm.prank(lab);
        try trace.recordTestResult(id, false, false, false, false, false, false, O_NEG) {} catch {}
        vm.prank(lab);
        try trace.releaseUnit(id) {} catch {}
    }

    function produceComponent(uint256 unitIdx, uint16 volSeed, uint8 typeSeed) external {
        if (unitIds.length == 0) return;
        uint256 id = unitIds[bound(unitIdx, 0, unitIds.length - 1)];
        uint16 vol = uint16(bound(uint256(volSeed), 1, 1000)); // intentionally allow over-cap to test the revert path
        Codes.ComponentType ct = Codes.ComponentType(uint8(bound(typeSeed, 1, 4)));

        vm.prank(frac);
        try trace.produceComponent(id, ct, vol) returns (uint256 cid) {
            componentIds.push(cid);
        } catch {}
    }

    function unitCount() external view returns (uint256) {
        return unitIds.length;
    }

    function componentCount() external view returns (uint256) {
        return componentIds.length;
    }
}
