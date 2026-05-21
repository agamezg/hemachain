// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {HemaRegistry} from "../src/HemaRegistry.sol";
import {HemaTraceability} from "../src/HemaTraceability.sol";
import {HemaCertificate} from "../src/HemaCertificate.sol";
import {Codes} from "../src/lib/Codes.sol";

/**
 * @title Seed
 * @notice Deploys the three contracts and seeds them with a demo dataset
 *         (6 institutional actors, 3 donations, 3 component splits, 1
 *         cold-chain excursion, 1 look-back recall, 1 revoked certificate).
 * @dev Local-Anvil only: hardcoded deterministic private keys. Run with:
 *      forge script script/Seed.s.sol --rpc-url http://localhost:8545 --broadcast
 */
contract Seed is Script {
    // ─── Anvil deterministic private keys (DO NOT use in production) ───────
    uint256 internal constant PK_ADMIN = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 internal constant PK_BANCO = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
    uint256 internal constant PK_LAB = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;
    uint256 internal constant PK_FRAC = 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6;
    uint256 internal constant PK_HOSPITAL = 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a;
    uint256 internal constant PK_AUDITOR = 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba;

    bytes8 internal constant O_NEG = bytes8("O-");
    bytes8 internal constant A_POS = bytes8("A+");

    bytes32 internal constant DONOR_ALPHA = keccak256("dni-alpha:salt-AR");
    bytes32 internal constant DONOR_BETA = keccak256("dni-beta:salt-AR");

    HemaRegistry internal registry;
    HemaTraceability internal trace;
    HemaCertificate internal cert;

    function run() external {
        _deploy();
        _approveAllRoles();
        _seedTraceabilityFlow();
        _seedCertificateFlow();

        console2.log("HemaRegistry    :", address(registry));
        console2.log("HemaTraceability:", address(trace));
        console2.log("HemaCertificate :", address(cert));
    }

    function _deploy() internal {
        vm.startBroadcast(PK_ADMIN);
        registry = new HemaRegistry(vm.addr(PK_ADMIN));
        trace = new HemaTraceability(address(registry));
        cert = new HemaCertificate(address(registry));
        vm.stopBroadcast();
    }

    function _approveAllRoles() internal {
        _requestAndApprove(PK_BANCO, keccak256("BANCO_SANGRE"), "Banco Garrahan");
        _requestAndApprove(PK_LAB, keccak256("LABORATORIO"), "Lab Central");
        _requestAndApprove(PK_FRAC, keccak256("FRACCIONAMIENTO"), "Centro Fraccionamiento");
        _requestAndApprove(PK_HOSPITAL, keccak256("MEDICINA_TRANSFUSIONAL"), "Hospital Italiano");
        _requestAndApprove(PK_AUDITOR, keccak256("AUDITOR"), "ANMAT");
        _requestAndApprove(PK_ADMIN, keccak256("CERTIFICADOR"), "AAHITC");
    }

    function _requestAndApprove(uint256 pk, bytes32 role, string memory name) internal {
        vm.startBroadcast(pk);
        registry.requestRole(role, name, "AR");
        vm.stopBroadcast();
        vm.startBroadcast(PK_ADMIN);
        registry.approveRole(vm.addr(pk));
        vm.stopBroadcast();
    }

    function _seedTraceabilityFlow() internal {
        uint256 u1 = _donateAndRelease(DONOR_ALPHA, 450, O_NEG);
        uint256 u2 = _donateAndRelease(DONOR_ALPHA, 450, O_NEG); // look-back target
        uint256 u3 = _donateAndRelease(DONOR_BETA, 450, A_POS);

        (uint256 c1,) = _splitWholeAndHalf(u1);
        uint256 c3 = _splitOneComponent(u3, Codes.ComponentType.RBC, 250);

        _excursionRecall(c1); // cold-chain excursion → auto-recall
        _transfuseSuccessfully(c3); // happy-path transfusion

        // Look-back: donor positive ⇒ both u1, u2 and their components recalled.
        vm.startBroadcast(PK_AUDITOR);
        trace.reportAdverseEvent(HemaTraceability.AdverseKind.DonorPositive, DONOR_ALPHA);
        vm.stopBroadcast();

        u2; // silence unused
    }

    function _donateAndRelease(bytes32 donor, uint16 vol, bytes8 abo) internal returns (uint256 unitId) {
        vm.startBroadcast(PK_BANCO);
        unitId = trace.registerDonation(donor, vol, abo);
        vm.stopBroadcast();
        vm.startBroadcast(PK_LAB);
        trace.recordTestResult(unitId, false, false, false, false, false, false, abo);
        trace.releaseUnit(unitId);
        vm.stopBroadcast();
    }

    function _splitWholeAndHalf(uint256 unitId) internal returns (uint256 cRbc, uint256 cFfp) {
        vm.startBroadcast(PK_FRAC);
        cRbc = trace.produceComponent(unitId, Codes.ComponentType.RBC, 250);
        cFfp = trace.produceComponent(unitId, Codes.ComponentType.FFP, 150);
        vm.stopBroadcast();
    }

    function _splitOneComponent(uint256 unitId, Codes.ComponentType ct, uint16 vol)
        internal
        returns (uint256 componentId)
    {
        vm.startBroadcast(PK_FRAC);
        componentId = trace.produceComponent(unitId, ct, vol);
        vm.stopBroadcast();
    }

    function _excursionRecall(uint256 componentId) internal {
        vm.startBroadcast(PK_FRAC);
        trace.transferComponentCustody(componentId, vm.addr(PK_HOSPITAL), 15, bytes32(0), bytes32(0)); // >6 °C on RBC
        vm.stopBroadcast();
    }

    function _transfuseSuccessfully(uint256 componentId) internal {
        vm.startBroadcast(PK_FRAC);
        trace.transferComponentCustody(componentId, vm.addr(PK_HOSPITAL), 4, bytes32(0), bytes32(0));
        vm.stopBroadcast();
        vm.startBroadcast(PK_HOSPITAL);
        trace.crossMatch(componentId, keccak256("hc-patient-1:salt-AR"));
        trace.recordTransfusion(componentId);
        vm.stopBroadcast();
    }

    function _seedCertificateFlow() internal {
        vm.startBroadcast(PK_ADMIN);
        uint256 tid = cert.issueCertificate(
            vm.addr(PK_BANCO),
            HemaCertificate.CertType.AAHITC,
            block.timestamp + 365 days,
            keccak256("seed-pdf"),
            "QmSeedExample"
        );
        cert.revokeCertificate(tid, "Periodic audit failure");
        vm.stopBroadcast();
    }
}
