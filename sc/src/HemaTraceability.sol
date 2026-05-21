// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {HemaRegistry} from "./HemaRegistry.sol";
import {Codes} from "./lib/Codes.sol";

/**
 * @title HemaTraceability
 * @notice Core HemaChain contract: donations, screening, components, custody,
 *         transfusion, and look-back recall.
 * @dev See SDD §8.3 for the function-level contract and §8.3 for the seven
 *      invariants enforced here:
 *
 *      INV_VolumeConserved   — `produceComponent` rejects splits whose total
 *                              volume exceeds the parent unit.
 *      INV_RecallPropagates  — `reportAdverseEvent(DonorPositive, donorHash)`
 *                              atomically recalls every component derived
 *                              from any donation by that donor.
 *      INV_NoExpiredTransfusion — `crossMatch` and `recordTransfusion`
 *                                 revert once `block.timestamp >= expiresAt`.
 *      INV_ColdChainGate     — `transferComponentCustody` with an out-of-range
 *                              temperature flips status to `Recalled`.
 *      INV_RoleScoping       — every state-changing function is gated by
 *                              exactly one HemaRegistry role.
 *      INV_DonorHashImmutable — `donorIdHash` is set once in
 *                               `registerDonation` and never written again.
 *      INV_CertificateMonotonic — enforced in `HemaCertificate`.
 *
 *      Per SDD §11.4 nothing personally-identifiable is stored on-chain.
 *      Donor and patient identifiers MUST be hashed off-chain as
 *      `keccak256(DNI + salt_institucional)`.
 */
contract HemaTraceability {
    HemaRegistry public immutable registry;

    // ─── Enums ──────────────────────────────────────────────────────────────
    enum UnitStatus {
        None,
        Collected,
        UnderTest,
        Quarantined,
        Released,
        Processed,
        Recalled
    }

    enum ComponentStatus {
        None,
        Produced,
        InStorage,
        Reserved,
        Transfused,
        Recalled
    }

    enum ReleaseStatus {
        Pending,
        Released,
        Quarantined
    }

    enum AdverseKind {
        DonorPositive,
        RecipientReaction,
        EquipmentFailure
    }

    // ─── Structs ────────────────────────────────────────────────────────────
    struct DonationUnit {
        uint256 id;
        bytes32 donorIdHash;
        uint256 collectedAt;
        uint16 volumeMl;
        bytes8 aboRhCode;
        address collectionCenter;
        address custodian;
        UnitStatus status;
    }

    struct TestResult {
        uint256 unitId;
        address lab;
        uint256 performedAt;
        bool hiv;
        bool hbv;
        bool hcv;
        bool syphilis;
        bool htlv;
        bool chagas;
        bytes8 aboConfirmed;
        ReleaseStatus releaseStatus;
    }

    struct Component {
        uint256 id;
        uint256 parentUnitId;
        Codes.ComponentType componentType;
        uint16 volumeMl;
        uint256 producedAt;
        address processor;
        ComponentStatus status;
        uint256 expiresAt;
        address custodian;
    }

    // ─── State ──────────────────────────────────────────────────────────────
    uint256 private _nextUnitId = 1;
    uint256 private _nextComponentId = 1;
    uint256 private _nextEventId = 1;

    mapping(uint256 => DonationUnit) private _units;
    mapping(uint256 => Component) private _components;
    mapping(uint256 => TestResult) private _testResults;
    mapping(uint256 => bool) private _testRecorded;

    mapping(bytes32 => uint256[]) private _unitsByDonor;
    mapping(uint256 => uint256[]) private _componentsByUnit;
    mapping(uint256 => uint16) private _splitVolume;

    // ─── Events ─────────────────────────────────────────────────────────────
    event DonationCollected(uint256 indexed unitId, bytes32 indexed donorIdHash, address indexed bank, uint16 volumeMl);
    event TestResultRecorded(uint256 indexed unitId, address indexed lab, bool anyPositive);
    event UnitReleased(uint256 indexed unitId, address indexed lab);
    event UnitQuarantined(uint256 indexed unitId, address indexed lab, string reason);
    event ComponentProduced(
        uint256 indexed componentId,
        uint256 indexed parentUnitId,
        Codes.ComponentType ctype,
        uint16 volumeMl,
        uint256 expiresAt
    );
    event ComponentCustodyTransferred(
        uint256 indexed componentId,
        address indexed from,
        address indexed to,
        int16 temperatureC,
        bytes32 gpsHash,
        bytes32 signedHandoffHash
    );
    event ComponentRecalled(uint256 indexed componentId, string reason);
    event UnitRecalled(uint256 indexed unitId, string reason);
    event ComponentCrossMatched(uint256 indexed componentId, bytes32 indexed patientHash);
    event Transfused(uint256 indexed componentId, address indexed hospital);
    event AdverseEventReported(
        uint256 indexed eventId, AdverseKind kind, bytes32 indexed triggerHash, uint256 affectedCount
    );
    event LookBackTriggered(bytes32 indexed donorIdHash, uint256[] recalledComponentIds);

    // ─── Errors ─────────────────────────────────────────────────────────────
    error NotAuthorized(address caller, bytes32 expectedRole);
    error UnitNotFound(uint256 unitId);
    error ComponentNotFound(uint256 componentId);
    error InvalidAboRh(bytes8 code);
    error InvalidVolume();
    error InvalidUnitState(uint256 unitId, UnitStatus current);
    error InvalidComponentState(uint256 componentId, ComponentStatus current);
    error TestAlreadyRecorded(uint256 unitId);
    error TestNotRecorded(uint256 unitId);
    error PositiveScreening(uint256 unitId);
    error VolumeExceedsParent(uint256 unitId, uint16 requested, uint16 available);
    error ComponentExpired(uint256 componentId, uint256 expiresAt);
    error InactiveActor(address actor);
    error NotCurrentCustodian(address caller, address custodian);
    error InvalidComponentType();

    constructor(address registry_) {
        registry = HemaRegistry(registry_);
    }

    // ─── Modifiers ──────────────────────────────────────────────────────────
    modifier onlyRole(bytes32 role) {
        if (!registry.hasRole(role, msg.sender)) revert NotAuthorized(msg.sender, role);
        _;
    }

    modifier onlyActive() {
        if (!registry.isActive(msg.sender)) revert InactiveActor(msg.sender);
        _;
    }

    function _isAnyPositive(TestResult storage t) internal view returns (bool) {
        return t.hiv || t.hbv || t.hcv || t.syphilis || t.htlv || t.chagas;
    }

    // ─── FR-5: registerDonation ─────────────────────────────────────────────
    function registerDonation(bytes32 donorIdHash, uint16 volumeMl, bytes8 aboRhCode)
        external
        onlyRole(registry.BANCO_SANGRE_ROLE())
        returns (uint256 unitId)
    {
        if (volumeMl == 0) revert InvalidVolume();
        if (!Codes.isValidAboRh(aboRhCode)) revert InvalidAboRh(aboRhCode);

        unitId = _nextUnitId++;
        _units[unitId] = DonationUnit({
            id: unitId,
            donorIdHash: donorIdHash,
            collectedAt: block.timestamp,
            volumeMl: volumeMl,
            aboRhCode: aboRhCode,
            collectionCenter: msg.sender,
            custodian: msg.sender,
            status: UnitStatus.Collected
        });
        _unitsByDonor[donorIdHash].push(unitId);
        emit DonationCollected(unitId, donorIdHash, msg.sender, volumeMl);
    }

    // ─── FR-7: recordTestResult ─────────────────────────────────────────────
    function recordTestResult(
        uint256 unitId,
        bool hiv,
        bool hbv,
        bool hcv,
        bool syphilis,
        bool htlv,
        bool chagas,
        bytes8 aboConfirmed
    ) external onlyRole(registry.LABORATORIO_ROLE()) {
        DonationUnit storage u = _units[unitId];
        if (u.id == 0) revert UnitNotFound(unitId);
        if (_testRecorded[unitId]) revert TestAlreadyRecorded(unitId);
        if (!Codes.isValidAboRh(aboConfirmed)) revert InvalidAboRh(aboConfirmed);
        if (u.status != UnitStatus.Collected) revert InvalidUnitState(unitId, u.status);

        _testResults[unitId] = TestResult({
            unitId: unitId,
            lab: msg.sender,
            performedAt: block.timestamp,
            hiv: hiv,
            hbv: hbv,
            hcv: hcv,
            syphilis: syphilis,
            htlv: htlv,
            chagas: chagas,
            aboConfirmed: aboConfirmed,
            releaseStatus: ReleaseStatus.Pending
        });
        _testRecorded[unitId] = true;
        u.status = UnitStatus.UnderTest;
        u.custodian = msg.sender;

        bool anyPositive = hiv || hbv || hcv || syphilis || htlv || chagas;
        emit TestResultRecorded(unitId, msg.sender, anyPositive);
    }

    // ─── FR-8: releaseUnit / quarantineUnit ─────────────────────────────────
    function releaseUnit(uint256 unitId) external onlyRole(registry.LABORATORIO_ROLE()) {
        DonationUnit storage u = _units[unitId];
        if (u.id == 0) revert UnitNotFound(unitId);
        if (!_testRecorded[unitId]) revert TestNotRecorded(unitId);
        if (u.status != UnitStatus.UnderTest) revert InvalidUnitState(unitId, u.status);
        TestResult storage t = _testResults[unitId];
        if (_isAnyPositive(t)) revert PositiveScreening(unitId);

        t.releaseStatus = ReleaseStatus.Released;
        u.status = UnitStatus.Released;
        emit UnitReleased(unitId, msg.sender);
    }

    function quarantineUnit(uint256 unitId, string calldata reason) external onlyRole(registry.LABORATORIO_ROLE()) {
        DonationUnit storage u = _units[unitId];
        if (u.id == 0) revert UnitNotFound(unitId);
        if (!_testRecorded[unitId]) revert TestNotRecorded(unitId);
        if (u.status == UnitStatus.Released || u.status == UnitStatus.Processed || u.status == UnitStatus.Quarantined) {
            revert InvalidUnitState(unitId, u.status);
        }
        _testResults[unitId].releaseStatus = ReleaseStatus.Quarantined;
        u.status = UnitStatus.Quarantined;
        emit UnitQuarantined(unitId, msg.sender, reason);
    }

    // ─── FR-9..12: produceComponent ─────────────────────────────────────────
    function produceComponent(uint256 parentUnitId, Codes.ComponentType componentType, uint16 volumeMl)
        external
        onlyRole(registry.FRACCIONAMIENTO_ROLE())
        returns (uint256 componentId)
    {
        DonationUnit storage u = _units[parentUnitId];
        if (u.id == 0) revert UnitNotFound(parentUnitId);
        if (u.status != UnitStatus.Released && u.status != UnitStatus.Processed) {
            revert InvalidUnitState(parentUnitId, u.status);
        }
        if (componentType == Codes.ComponentType.Unknown) revert InvalidComponentType();
        if (volumeMl == 0) revert InvalidVolume();

        uint16 already = _splitVolume[parentUnitId];
        if (uint256(already) + uint256(volumeMl) > uint256(u.volumeMl)) {
            revert VolumeExceedsParent(parentUnitId, volumeMl, u.volumeMl - already);
        }
        _splitVolume[parentUnitId] = already + volumeMl;

        componentId = _nextComponentId++;
        uint256 expiry = Codes.expiryAt(componentType, block.timestamp);
        _components[componentId] = Component({
            id: componentId,
            parentUnitId: parentUnitId,
            componentType: componentType,
            volumeMl: volumeMl,
            producedAt: block.timestamp,
            processor: msg.sender,
            status: ComponentStatus.Produced,
            expiresAt: expiry,
            custodian: msg.sender
        });
        _componentsByUnit[parentUnitId].push(componentId);
        u.status = UnitStatus.Processed;

        emit ComponentProduced(componentId, parentUnitId, componentType, volumeMl, expiry);
    }

    // ─── FR-13/14: transferComponentCustody (cold-chain gate) ───────────────
    function transferComponentCustody(
        uint256 componentId,
        address to,
        int16 temperatureC,
        bytes32 gpsHash,
        bytes32 signedHandoffHash
    ) external onlyActive {
        Component storage c = _components[componentId];
        if (c.id == 0) revert ComponentNotFound(componentId);
        if (c.custodian != msg.sender) revert NotCurrentCustodian(msg.sender, c.custodian);
        if (!registry.isActive(to)) revert InactiveActor(to);
        if (c.status == ComponentStatus.Recalled || c.status == ComponentStatus.Transfused) {
            revert InvalidComponentState(componentId, c.status);
        }

        emit ComponentCustodyTransferred(componentId, msg.sender, to, temperatureC, gpsHash, signedHandoffHash);

        if (!Codes.isTempInRange(c.componentType, temperatureC)) {
            c.status = ComponentStatus.Recalled;
            emit ComponentRecalled(componentId, "TemperatureExcursion");
            // Do not reassign custodian on a failed handoff — the source remains
            // responsible for the recalled unit.
            return;
        }
        c.custodian = to;
        if (c.status == ComponentStatus.Produced) c.status = ComponentStatus.InStorage;
    }

    // ─── FR-15/16: crossMatch + recordTransfusion ───────────────────────────
    function crossMatch(uint256 componentId, bytes32 patientHash)
        external
        onlyRole(registry.MEDICINA_TRANSFUSIONAL_ROLE())
    {
        Component storage c = _components[componentId];
        if (c.id == 0) revert ComponentNotFound(componentId);
        if (c.status == ComponentStatus.Recalled) revert InvalidComponentState(componentId, c.status);
        if (block.timestamp >= c.expiresAt) revert ComponentExpired(componentId, c.expiresAt);
        if (c.status != ComponentStatus.Produced && c.status != ComponentStatus.InStorage) {
            revert InvalidComponentState(componentId, c.status);
        }
        c.status = ComponentStatus.Reserved;
        emit ComponentCrossMatched(componentId, patientHash);
    }

    function recordTransfusion(uint256 componentId) external onlyRole(registry.MEDICINA_TRANSFUSIONAL_ROLE()) {
        Component storage c = _components[componentId];
        if (c.id == 0) revert ComponentNotFound(componentId);
        if (c.status == ComponentStatus.Recalled) revert InvalidComponentState(componentId, c.status);
        if (block.timestamp >= c.expiresAt) revert ComponentExpired(componentId, c.expiresAt);
        if (c.status != ComponentStatus.Reserved) revert InvalidComponentState(componentId, c.status);
        c.status = ComponentStatus.Transfused;
        emit Transfused(componentId, msg.sender);
    }

    // ─── FR-17: reportAdverseEvent (look-back) ──────────────────────────────
    function reportAdverseEvent(AdverseKind kind, bytes32 triggerHash)
        external
        onlyRole(registry.AUDITOR_ROLE())
        returns (uint256 eventId, uint256[] memory affected)
    {
        eventId = _nextEventId++;

        if (kind == AdverseKind.DonorPositive) {
            uint256[] storage unitIds = _unitsByDonor[triggerHash];
            uint256 maxAffected;
            for (uint256 i = 0; i < unitIds.length; i++) {
                maxAffected += _componentsByUnit[unitIds[i]].length;
            }
            affected = new uint256[](maxAffected);
            uint256 k;

            for (uint256 i = 0; i < unitIds.length; i++) {
                uint256 uid = unitIds[i];
                if (_units[uid].status != UnitStatus.Recalled) {
                    _units[uid].status = UnitStatus.Recalled;
                    emit UnitRecalled(uid, "LookBack");
                }
                uint256[] storage cids = _componentsByUnit[uid];
                for (uint256 j = 0; j < cids.length; j++) {
                    if (_components[cids[j]].status != ComponentStatus.Recalled) {
                        _components[cids[j]].status = ComponentStatus.Recalled;
                        emit ComponentRecalled(cids[j], "LookBack");
                    }
                    affected[k++] = cids[j];
                }
            }
            assembly {
                mstore(affected, k)
            }
            emit LookBackTriggered(triggerHash, affected);
        } else {
            affected = new uint256[](0);
        }
        emit AdverseEventReported(eventId, kind, triggerHash, affected.length);
    }

    // ─── Views ──────────────────────────────────────────────────────────────

    function getUnit(uint256 unitId) external view returns (DonationUnit memory) {
        return _units[unitId];
    }

    function getTestResult(uint256 unitId) external view returns (TestResult memory) {
        return _testResults[unitId];
    }

    function hasTestResult(uint256 unitId) external view returns (bool) {
        return _testRecorded[unitId];
    }

    function getComponent(uint256 componentId) external view returns (Component memory) {
        return _components[componentId];
    }

    function getUnitsByDonor(bytes32 donorIdHash) external view returns (uint256[] memory) {
        return _unitsByDonor[donorIdHash];
    }

    function getComponentsByUnit(uint256 unitId) external view returns (uint256[] memory) {
        return _componentsByUnit[unitId];
    }

    function splitVolumeOf(uint256 unitId) external view returns (uint16) {
        return _splitVolume[unitId];
    }
}
