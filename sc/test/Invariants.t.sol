// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {HemaRegistry} from "../src/HemaRegistry.sol";
import {HemaTraceability} from "../src/HemaTraceability.sol";
import {HemaCertificate} from "../src/HemaCertificate.sol";
import {Codes} from "../src/lib/Codes.sol";
import {TraceabilityHandler} from "./handlers/TraceabilityHandler.sol";

/**
 * @title HemaInvariantsTest
 * @notice Forge invariant suite for the SDD §8.3 properties that are most
 *         naturally expressed as global predicates over random call
 *         sequences. Pure-function/single-call properties (RoleScoping,
 *         ColdChainGate) are covered by the per-contract unit tests instead.
 */
contract HemaInvariantsTest is Test {
    HemaRegistry internal registry;
    HemaTraceability internal trace;
    TraceabilityHandler internal handler;

    bytes32 internal constant BANCO_SANGRE_ROLE = keccak256("BANCO_SANGRE");
    bytes32 internal constant LABORATORIO_ROLE = keccak256("LABORATORIO");
    bytes32 internal constant FRACCIONAMIENTO_ROLE = keccak256("FRACCIONAMIENTO");

    function setUp() public {
        address admin = makeAddr("admin");
        address banco = makeAddr("banco");
        address lab = makeAddr("lab");
        address frac = makeAddr("frac");

        registry = new HemaRegistry(admin);
        trace = new HemaTraceability(address(registry));

        _registerAndApprove(admin, banco, BANCO_SANGRE_ROLE);
        _registerAndApprove(admin, lab, LABORATORIO_ROLE);
        _registerAndApprove(admin, frac, FRACCIONAMIENTO_ROLE);

        handler = new TraceabilityHandler(registry, trace, banco, lab, frac);
        targetContract(address(handler));
    }

    function _registerAndApprove(address admin, address actor, bytes32 role) internal {
        vm.prank(actor);
        registry.requestRole(role, "Inst", "AR");
        vm.prank(admin);
        registry.approveRole(actor);
    }

    /// @notice INV_VolumeConserved — for every unit, the sum of split volumes
    ///         must never exceed the original donation volume.
    function invariant_VolumeConserved() public view {
        uint256 n = handler.unitCount();
        for (uint256 i = 0; i < n; i++) {
            uint256 id = handler.unitIds(i);
            HemaTraceability.DonationUnit memory u = trace.getUnit(id);
            uint16 split = trace.splitVolumeOf(id);
            assertLe(uint256(split), uint256(u.volumeMl));
        }
    }

    /// @notice INV_DonorHashImmutable — the donor hash on a unit is set once
    ///         in registerDonation and never written again.
    function invariant_DonorHashImmutable() public view {
        uint256 n = handler.unitCount();
        for (uint256 i = 0; i < n; i++) {
            uint256 id = handler.unitIds(i);
            HemaTraceability.DonationUnit memory u = trace.getUnit(id);
            bytes32 atFirst = handler.donorAtFirstObservation(id);
            assertEq(u.donorIdHash, atFirst);
        }
    }

    /// @notice INV_ComponentParentLinked — every component points at a unit
    ///         that exists, and the donor index round-trips.
    function invariant_ComponentLinkage() public view {
        uint256 n = handler.componentCount();
        for (uint256 i = 0; i < n; i++) {
            uint256 cid = handler.componentIds(i);
            HemaTraceability.Component memory c = trace.getComponent(cid);
            assertGt(c.parentUnitId, 0);
            HemaTraceability.DonationUnit memory u = trace.getUnit(c.parentUnitId);
            assertGt(u.id, 0);
        }
    }
}

/// @title CertificateMonotonicFuzz
/// @notice Property-based test for INV_CertificateMonotonic via direct fuzz,
///         not a handler-driven invariant (transitions depend on wall time +
///         a single admin call, so randomising arguments is more efficient
///         than randomising call sequences).
contract CertificateMonotonicFuzz is Test {
    HemaRegistry internal registry;
    HemaCertificate internal cert;
    address internal admin;
    address internal certificador;
    address internal subject;

    bytes32 internal constant CERTIFICADOR_ROLE = keccak256("CERTIFICADOR");

    function setUp() public {
        admin = makeAddr("admin");
        certificador = makeAddr("certificador");
        subject = makeAddr("subject");

        registry = new HemaRegistry(admin);
        cert = new HemaCertificate(address(registry));

        vm.prank(certificador);
        registry.requestRole(CERTIFICADOR_ROLE, "AAHITC", "AR");
        vm.prank(admin);
        registry.approveRole(certificador);
    }

    /// @dev Once a token is Revoked, no warp-forward can move it back to
    ///      Valid or to Expired — Revoked is terminal.
    function testFuzz_RevokedDominatesTimeWarp(uint64 warpSeconds) public {
        uint256 expiry = block.timestamp + 365 days;
        vm.prank(certificador);
        uint256 tid = cert.issueCertificate(subject, HemaCertificate.CertType.AAHITC, expiry, keccak256("pdf"), "QmCID");
        vm.prank(certificador);
        cert.revokeCertificate(tid, "test");

        vm.warp(block.timestamp + uint256(warpSeconds));
        assertEq(uint256(cert.statusOf(tid)), uint256(HemaCertificate.CertStatus.Revoked));
    }

    /// @dev An Expired token cannot be revoked — INV_CertificateMonotonic
    ///      forbids Expired → Revoked transition.
    function testFuzz_CannotRevokeExpired(uint64 expirySeed) public {
        uint256 ttl = bound(expirySeed, 1, 10 * 365 days);
        uint256 expiry = block.timestamp + ttl;
        vm.prank(certificador);
        uint256 tid = cert.issueCertificate(subject, HemaCertificate.CertType.AAHITC, expiry, keccak256("pdf"), "QmCID");

        vm.warp(expiry); // exactly at expiry — already terminal
        vm.prank(certificador);
        vm.expectRevert(abi.encodeWithSelector(HemaCertificate.AlreadyExpired.selector, tid));
        cert.revokeCertificate(tid, "x");
    }
}
