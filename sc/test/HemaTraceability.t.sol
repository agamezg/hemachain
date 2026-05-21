// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {HemaRegistry} from "../src/HemaRegistry.sol";
import {HemaTraceability} from "../src/HemaTraceability.sol";
import {Codes} from "../src/lib/Codes.sol";

contract HemaTraceabilityTest is Test {
    HemaRegistry internal registry;
    HemaTraceability internal trace;

    address internal admin;
    address internal banco;
    address internal lab;
    address internal frac;
    address internal hospital;
    address internal auditor;
    address internal outsider;

    bytes32 internal constant BANCO_SANGRE_ROLE = keccak256("BANCO_SANGRE");
    bytes32 internal constant LABORATORIO_ROLE = keccak256("LABORATORIO");
    bytes32 internal constant FRACCIONAMIENTO_ROLE = keccak256("FRACCIONAMIENTO");
    bytes32 internal constant MEDICINA_TRANSFUSIONAL_ROLE = keccak256("MEDICINA_TRANSFUSIONAL");
    bytes32 internal constant AUDITOR_ROLE = keccak256("AUDITOR");

    bytes8 internal constant O_NEG = bytes8("O-");
    bytes8 internal constant A_POS = bytes8("A+");

    bytes32 internal constant DONOR_1 = keccak256(abi.encode("dni-1", "salt"));
    bytes32 internal constant DONOR_2 = keccak256(abi.encode("dni-2", "salt"));
    bytes32 internal constant PATIENT = keccak256(abi.encode("hc-1", "salt"));

    function setUp() public {
        admin = makeAddr("admin");
        banco = makeAddr("banco");
        lab = makeAddr("lab");
        frac = makeAddr("frac");
        hospital = makeAddr("hospital");
        auditor = makeAddr("auditor");
        outsider = makeAddr("outsider");

        registry = new HemaRegistry(admin);
        trace = new HemaTraceability(address(registry));

        _registerAndApprove(banco, BANCO_SANGRE_ROLE);
        _registerAndApprove(lab, LABORATORIO_ROLE);
        _registerAndApprove(frac, FRACCIONAMIENTO_ROLE);
        _registerAndApprove(hospital, MEDICINA_TRANSFUSIONAL_ROLE);
        _registerAndApprove(auditor, AUDITOR_ROLE);
    }

    function _registerAndApprove(address actor, bytes32 role) internal {
        vm.prank(actor);
        registry.requestRole(role, "TestInstitution", "AR");
        vm.prank(admin);
        registry.approveRole(actor);
    }

    /// Helper: collect a donation → record negative test → release.
    function _donateAndRelease(address bank, bytes32 donor, uint16 vol) internal returns (uint256 unitId) {
        vm.prank(bank);
        unitId = trace.registerDonation(donor, vol, O_NEG);
        vm.prank(lab);
        trace.recordTestResult(unitId, false, false, false, false, false, false, O_NEG);
        vm.prank(lab);
        trace.releaseUnit(unitId);
    }

    // ─── registerDonation ──────────────────────────────────────────────────

    function test_RegisterDonation_StoresUnit() public {
        vm.prank(banco);
        uint256 id = trace.registerDonation(DONOR_1, 450, O_NEG);

        HemaTraceability.DonationUnit memory u = trace.getUnit(id);
        assertEq(u.id, id);
        assertEq(u.donorIdHash, DONOR_1);
        assertEq(u.volumeMl, 450);
        assertEq(u.aboRhCode, O_NEG);
        assertEq(u.collectionCenter, banco);
        assertEq(u.custodian, banco);
        assertEq(uint256(u.status), uint256(HemaTraceability.UnitStatus.Collected));
    }

    function test_RegisterDonation_IndexesByDonor() public {
        vm.prank(banco);
        uint256 a = trace.registerDonation(DONOR_1, 450, O_NEG);
        vm.prank(banco);
        uint256 b = trace.registerDonation(DONOR_1, 450, O_NEG);

        uint256[] memory units = trace.getUnitsByDonor(DONOR_1);
        assertEq(units.length, 2);
        assertEq(units[0], a);
        assertEq(units[1], b);
    }

    function test_RegisterDonation_RevertsForNonBank() public {
        vm.prank(lab);
        vm.expectRevert(abi.encodeWithSelector(HemaTraceability.NotAuthorized.selector, lab, BANCO_SANGRE_ROLE));
        trace.registerDonation(DONOR_1, 450, O_NEG);
    }

    function test_RegisterDonation_RevertsOnZeroVolume() public {
        vm.prank(banco);
        vm.expectRevert(HemaTraceability.InvalidVolume.selector);
        trace.registerDonation(DONOR_1, 0, O_NEG);
    }

    function test_RegisterDonation_RevertsOnInvalidAboRh() public {
        bytes8 bogus = bytes8("ZZ");
        vm.prank(banco);
        vm.expectRevert(abi.encodeWithSelector(HemaTraceability.InvalidAboRh.selector, bogus));
        trace.registerDonation(DONOR_1, 450, bogus);
    }

    // ─── recordTestResult ──────────────────────────────────────────────────

    function test_RecordTestResult_StoresAndSetsUnderTest() public {
        vm.prank(banco);
        uint256 id = trace.registerDonation(DONOR_1, 450, O_NEG);
        vm.prank(lab);
        trace.recordTestResult(id, false, false, false, false, false, false, O_NEG);

        assertTrue(trace.hasTestResult(id));
        HemaTraceability.TestResult memory t = trace.getTestResult(id);
        assertEq(t.lab, lab);
        assertFalse(t.chagas);
        assertEq(uint256(trace.getUnit(id).status), uint256(HemaTraceability.UnitStatus.UnderTest));
    }

    function test_RecordTestResult_StoresChagas() public {
        // Chagas is the regionally-mandatory field per SDD §2.5.
        vm.prank(banco);
        uint256 id = trace.registerDonation(DONOR_1, 450, O_NEG);
        vm.prank(lab);
        trace.recordTestResult(id, false, false, false, false, false, true, O_NEG);
        assertTrue(trace.getTestResult(id).chagas);
    }

    function test_RecordTestResult_RevertsForNonLab() public {
        vm.prank(banco);
        uint256 id = trace.registerDonation(DONOR_1, 450, O_NEG);
        vm.prank(banco);
        vm.expectRevert(abi.encodeWithSelector(HemaTraceability.NotAuthorized.selector, banco, LABORATORIO_ROLE));
        trace.recordTestResult(id, false, false, false, false, false, false, O_NEG);
    }

    function test_RecordTestResult_RevertsOnUnknownUnit() public {
        vm.prank(lab);
        vm.expectRevert(abi.encodeWithSelector(HemaTraceability.UnitNotFound.selector, 999));
        trace.recordTestResult(999, false, false, false, false, false, false, O_NEG);
    }

    function test_RecordTestResult_RevertsOnDoubleRecord() public {
        vm.prank(banco);
        uint256 id = trace.registerDonation(DONOR_1, 450, O_NEG);
        vm.prank(lab);
        trace.recordTestResult(id, false, false, false, false, false, false, O_NEG);
        vm.prank(lab);
        vm.expectRevert(abi.encodeWithSelector(HemaTraceability.TestAlreadyRecorded.selector, id));
        trace.recordTestResult(id, false, false, false, false, false, false, O_NEG);
    }

    // ─── releaseUnit ───────────────────────────────────────────────────────

    function test_ReleaseUnit_HappyPath() public {
        uint256 id = _donateAndRelease(banco, DONOR_1, 450);
        assertEq(uint256(trace.getUnit(id).status), uint256(HemaTraceability.UnitStatus.Released));
    }

    function test_ReleaseUnit_RevertsIfPositive() public {
        vm.prank(banco);
        uint256 id = trace.registerDonation(DONOR_1, 450, O_NEG);
        vm.prank(lab);
        trace.recordTestResult(id, true, false, false, false, false, false, O_NEG); // HIV+
        vm.prank(lab);
        vm.expectRevert(abi.encodeWithSelector(HemaTraceability.PositiveScreening.selector, id));
        trace.releaseUnit(id);
    }

    function test_ReleaseUnit_RevertsIfChagasPositive() public {
        vm.prank(banco);
        uint256 id = trace.registerDonation(DONOR_1, 450, O_NEG);
        vm.prank(lab);
        trace.recordTestResult(id, false, false, false, false, false, true, O_NEG); // Chagas+
        vm.prank(lab);
        vm.expectRevert(abi.encodeWithSelector(HemaTraceability.PositiveScreening.selector, id));
        trace.releaseUnit(id);
    }

    function test_ReleaseUnit_RevertsBeforeTest() public {
        vm.prank(banco);
        uint256 id = trace.registerDonation(DONOR_1, 450, O_NEG);
        vm.prank(lab);
        vm.expectRevert(abi.encodeWithSelector(HemaTraceability.TestNotRecorded.selector, id));
        trace.releaseUnit(id);
    }

    // ─── quarantineUnit ────────────────────────────────────────────────────

    function test_QuarantineUnit_HappyPath() public {
        vm.prank(banco);
        uint256 id = trace.registerDonation(DONOR_1, 450, O_NEG);
        vm.prank(lab);
        trace.recordTestResult(id, true, false, false, false, false, false, O_NEG);
        vm.prank(lab);
        trace.quarantineUnit(id, "HIV positive");
        assertEq(uint256(trace.getUnit(id).status), uint256(HemaTraceability.UnitStatus.Quarantined));
    }

    function test_QuarantineUnit_RevertsAfterRelease() public {
        uint256 id = _donateAndRelease(banco, DONOR_1, 450);
        vm.prank(lab);
        vm.expectRevert(
            abi.encodeWithSelector(HemaTraceability.InvalidUnitState.selector, id, HemaTraceability.UnitStatus.Released)
        );
        trace.quarantineUnit(id, "too late");
    }

    // ─── produceComponent ──────────────────────────────────────────────────

    function test_ProduceComponent_SplitsAndExpires() public {
        uint256 unitId = _donateAndRelease(banco, DONOR_1, 450);
        vm.prank(frac);
        uint256 cid = trace.produceComponent(unitId, Codes.ComponentType.RBC, 250);

        HemaTraceability.Component memory c = trace.getComponent(cid);
        assertEq(c.parentUnitId, unitId);
        assertEq(uint256(c.componentType), uint256(Codes.ComponentType.RBC));
        assertEq(c.volumeMl, 250);
        assertEq(c.expiresAt, block.timestamp + 42 days);
        assertEq(c.custodian, frac);
        assertEq(uint256(c.status), uint256(HemaTraceability.ComponentStatus.Produced));
    }

    function test_ProduceComponent_MarksParentProcessed() public {
        uint256 unitId = _donateAndRelease(banco, DONOR_1, 450);
        vm.prank(frac);
        trace.produceComponent(unitId, Codes.ComponentType.RBC, 250);
        assertEq(uint256(trace.getUnit(unitId).status), uint256(HemaTraceability.UnitStatus.Processed));
    }

    function test_ProduceComponent_AllowsMultipleSplitsUnderCap() public {
        uint256 unitId = _donateAndRelease(banco, DONOR_1, 450);
        vm.startPrank(frac);
        trace.produceComponent(unitId, Codes.ComponentType.RBC, 250);
        trace.produceComponent(unitId, Codes.ComponentType.FFP, 150);
        trace.produceComponent(unitId, Codes.ComponentType.PLT, 50);
        vm.stopPrank();
        assertEq(trace.splitVolumeOf(unitId), 450);
    }

    function test_ProduceComponent_RevertsIfVolumeExceedsParent() public {
        uint256 unitId = _donateAndRelease(banco, DONOR_1, 450);
        vm.prank(frac);
        trace.produceComponent(unitId, Codes.ComponentType.RBC, 300);
        vm.prank(frac);
        vm.expectRevert(abi.encodeWithSelector(HemaTraceability.VolumeExceedsParent.selector, unitId, 200, 150));
        trace.produceComponent(unitId, Codes.ComponentType.FFP, 200);
    }

    function test_ProduceComponent_RevertsForNonFrac() public {
        uint256 unitId = _donateAndRelease(banco, DONOR_1, 450);
        vm.prank(lab);
        vm.expectRevert(abi.encodeWithSelector(HemaTraceability.NotAuthorized.selector, lab, FRACCIONAMIENTO_ROLE));
        trace.produceComponent(unitId, Codes.ComponentType.RBC, 250);
    }

    function test_ProduceComponent_RevertsIfUnitNotReleased() public {
        vm.prank(banco);
        uint256 id = trace.registerDonation(DONOR_1, 450, O_NEG);
        vm.prank(frac);
        vm.expectRevert(
            abi.encodeWithSelector(
                HemaTraceability.InvalidUnitState.selector, id, HemaTraceability.UnitStatus.Collected
            )
        );
        trace.produceComponent(id, Codes.ComponentType.RBC, 250);
    }

    // ─── transferComponentCustody (cold-chain gate) ────────────────────────

    function test_TransferComponentCustody_HappyPath() public {
        uint256 cid = _produceRbc(450);

        vm.prank(frac);
        trace.transferComponentCustody(cid, hospital, 4, bytes32(0), bytes32(0));

        HemaTraceability.Component memory c = trace.getComponent(cid);
        assertEq(c.custodian, hospital);
        assertEq(uint256(c.status), uint256(HemaTraceability.ComponentStatus.InStorage));
    }

    function test_TransferComponentCustody_TempExcursionRecalls() public {
        uint256 cid = _produceRbc(450);

        vm.prank(frac);
        trace.transferComponentCustody(cid, hospital, 15, bytes32(0), bytes32(0)); // far above RBC max

        HemaTraceability.Component memory c = trace.getComponent(cid);
        assertEq(uint256(c.status), uint256(HemaTraceability.ComponentStatus.Recalled));
        // Source remains custodian on a failed handoff.
        assertEq(c.custodian, frac);
    }

    function test_TransferComponentCustody_RevertsIfNotCurrentCustodian() public {
        uint256 cid = _produceRbc(450);
        vm.prank(hospital);
        vm.expectRevert(abi.encodeWithSelector(HemaTraceability.NotCurrentCustodian.selector, hospital, frac));
        trace.transferComponentCustody(cid, hospital, 4, bytes32(0), bytes32(0));
    }

    function test_TransferComponentCustody_RevertsIfTargetInactive() public {
        uint256 cid = _produceRbc(450);
        vm.prank(frac);
        vm.expectRevert(abi.encodeWithSelector(HemaTraceability.InactiveActor.selector, outsider));
        trace.transferComponentCustody(cid, outsider, 4, bytes32(0), bytes32(0));
    }

    function test_TransferComponentCustody_RevertsForInactiveCaller() public {
        uint256 cid = _produceRbc(450);
        vm.prank(outsider);
        vm.expectRevert(abi.encodeWithSelector(HemaTraceability.InactiveActor.selector, outsider));
        trace.transferComponentCustody(cid, hospital, 4, bytes32(0), bytes32(0));
    }

    function _produceRbc(uint16 vol) internal returns (uint256 cid) {
        uint256 unitId = _donateAndRelease(banco, DONOR_1, vol);
        vm.prank(frac);
        cid = trace.produceComponent(unitId, Codes.ComponentType.RBC, vol);
    }

    // ─── crossMatch + recordTransfusion ────────────────────────────────────

    function test_CrossMatch_ReservesComponent() public {
        uint256 cid = _produceRbc(450);
        vm.prank(frac);
        trace.transferComponentCustody(cid, hospital, 4, bytes32(0), bytes32(0));

        vm.prank(hospital);
        trace.crossMatch(cid, PATIENT);
        assertEq(uint256(trace.getComponent(cid).status), uint256(HemaTraceability.ComponentStatus.Reserved));
    }

    function test_CrossMatch_RevertsIfRecalled() public {
        uint256 cid = _produceRbc(450);
        vm.prank(frac);
        trace.transferComponentCustody(cid, hospital, 15, bytes32(0), bytes32(0)); // recall

        vm.prank(hospital);
        vm.expectRevert(
            abi.encodeWithSelector(
                HemaTraceability.InvalidComponentState.selector, cid, HemaTraceability.ComponentStatus.Recalled
            )
        );
        trace.crossMatch(cid, PATIENT);
    }

    function test_CrossMatch_RevertsAfterExpiry() public {
        uint256 cid = _produceRbc(450);
        vm.prank(frac);
        trace.transferComponentCustody(cid, hospital, 4, bytes32(0), bytes32(0));

        vm.warp(block.timestamp + 43 days); // RBC expires at 42 days

        vm.prank(hospital);
        vm.expectRevert();
        trace.crossMatch(cid, PATIENT);
    }

    function test_RecordTransfusion_HappyPath() public {
        uint256 cid = _produceRbc(450);
        vm.prank(frac);
        trace.transferComponentCustody(cid, hospital, 4, bytes32(0), bytes32(0));
        vm.prank(hospital);
        trace.crossMatch(cid, PATIENT);
        vm.prank(hospital);
        trace.recordTransfusion(cid);

        assertEq(uint256(trace.getComponent(cid).status), uint256(HemaTraceability.ComponentStatus.Transfused));
    }

    function test_RecordTransfusion_RevertsWithoutCrossMatch() public {
        uint256 cid = _produceRbc(450);
        vm.prank(frac);
        trace.transferComponentCustody(cid, hospital, 4, bytes32(0), bytes32(0));

        vm.prank(hospital);
        vm.expectRevert();
        trace.recordTransfusion(cid);
    }

    // ─── reportAdverseEvent (look-back) ────────────────────────────────────

    function test_LookBack_RecallsAllDerivedComponents() public {
        // DONOR_1 donates twice, each split into 2 components.
        uint256 u1 = _donateAndRelease(banco, DONOR_1, 450);
        vm.prank(frac);
        uint256 c1 = trace.produceComponent(u1, Codes.ComponentType.RBC, 250);
        vm.prank(frac);
        uint256 c2 = trace.produceComponent(u1, Codes.ComponentType.FFP, 150);

        uint256 u2 = _donateAndRelease(banco, DONOR_1, 450);
        vm.prank(frac);
        uint256 c3 = trace.produceComponent(u2, Codes.ComponentType.RBC, 250);

        // Unrelated donor — must NOT be touched.
        uint256 u3 = _donateAndRelease(banco, DONOR_2, 450);
        vm.prank(frac);
        uint256 c4 = trace.produceComponent(u3, Codes.ComponentType.RBC, 250);

        vm.prank(auditor);
        (, uint256[] memory affected) = trace.reportAdverseEvent(HemaTraceability.AdverseKind.DonorPositive, DONOR_1);

        assertEq(affected.length, 3);
        assertEq(uint256(trace.getComponent(c1).status), uint256(HemaTraceability.ComponentStatus.Recalled));
        assertEq(uint256(trace.getComponent(c2).status), uint256(HemaTraceability.ComponentStatus.Recalled));
        assertEq(uint256(trace.getComponent(c3).status), uint256(HemaTraceability.ComponentStatus.Recalled));
        assertEq(uint256(trace.getComponent(c4).status), uint256(HemaTraceability.ComponentStatus.Produced));
        assertEq(uint256(trace.getUnit(u1).status), uint256(HemaTraceability.UnitStatus.Recalled));
        assertEq(uint256(trace.getUnit(u2).status), uint256(HemaTraceability.UnitStatus.Recalled));
        assertEq(uint256(trace.getUnit(u3).status), uint256(HemaTraceability.UnitStatus.Processed));
    }

    function test_LookBack_IsIdempotent() public {
        uint256 u = _donateAndRelease(banco, DONOR_1, 450);
        vm.prank(frac);
        trace.produceComponent(u, Codes.ComponentType.RBC, 250);

        vm.prank(auditor);
        trace.reportAdverseEvent(HemaTraceability.AdverseKind.DonorPositive, DONOR_1);
        vm.prank(auditor);
        (, uint256[] memory affected) = trace.reportAdverseEvent(HemaTraceability.AdverseKind.DonorPositive, DONOR_1);
        // Second call still reports the components but doesn't double-recall.
        assertEq(affected.length, 1);
    }

    function test_LookBack_RevertsForNonAuditor() public {
        vm.prank(banco);
        vm.expectRevert(abi.encodeWithSelector(HemaTraceability.NotAuthorized.selector, banco, AUDITOR_ROLE));
        trace.reportAdverseEvent(HemaTraceability.AdverseKind.DonorPositive, DONOR_1);
    }

    function test_LookBack_EmptyDonor_ReturnsZero() public {
        bytes32 unknown = keccak256("nobody");
        vm.prank(auditor);
        (, uint256[] memory affected) = trace.reportAdverseEvent(HemaTraceability.AdverseKind.DonorPositive, unknown);
        assertEq(affected.length, 0);
    }

    function test_LookBack_DonorWithUnprocessedDonation() public {
        // Donor has a collected donation but no components yet.
        vm.prank(banco);
        uint256 u = trace.registerDonation(DONOR_1, 450, O_NEG);

        vm.prank(auditor);
        (, uint256[] memory affected) = trace.reportAdverseEvent(HemaTraceability.AdverseKind.DonorPositive, DONOR_1);
        assertEq(affected.length, 0);
        assertEq(uint256(trace.getUnit(u).status), uint256(HemaTraceability.UnitStatus.Recalled));
    }
}
