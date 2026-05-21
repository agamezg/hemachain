// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {AccessControlEnumerable} from "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";

/**
 * @title HemaRegistry
 * @notice Actor and role registry for HemaChain.
 * @dev Implements a request/approve workflow on top of `AccessControlEnumerable`.
 *      The `DEFAULT_ADMIN_ROLE` holder approves or rejects role requests; the
 *      admin has no operational write permissions on the traceability layer
 *      (separation of concerns — SDD §3.1).
 *
 *      Per SDD §11.4 the registry stores institution names and countries
 *      on-chain. It MUST NOT store personally-identifiable information for
 *      donors or patients — those live off-chain under each institution's
 *      custody (Ley 25.326 / SDD §11.4).
 */
contract HemaRegistry is AccessControlEnumerable {
    // ─── Roles ──────────────────────────────────────────────────────────────
    bytes32 public constant BANCO_SANGRE_ROLE = keccak256("BANCO_SANGRE");
    bytes32 public constant LABORATORIO_ROLE = keccak256("LABORATORIO");
    bytes32 public constant FRACCIONAMIENTO_ROLE = keccak256("FRACCIONAMIENTO");
    bytes32 public constant MEDICINA_TRANSFUSIONAL_ROLE = keccak256("MEDICINA_TRANSFUSIONAL");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR");
    bytes32 public constant CERTIFICADOR_ROLE = keccak256("CERTIFICADOR");

    // ─── Types ──────────────────────────────────────────────────────────────
    struct Actor {
        address addr;
        bytes32 role;
        string name;
        string country;
        uint256 registeredAt;
    }

    struct PendingRequest {
        bytes32 role;
        string name;
        string country;
        uint256 requestedAt;
    }

    // ─── State ──────────────────────────────────────────────────────────────
    mapping(address => Actor) private _actors;
    mapping(address => PendingRequest) private _pending;

    // ─── Events ─────────────────────────────────────────────────────────────
    event RoleRequested(address indexed actor, bytes32 indexed role, string name, string country);
    event RoleApproved(address indexed actor, bytes32 indexed role, address indexed admin);
    event RoleRejected(address indexed actor, bytes32 indexed role, address indexed admin);
    event ActorRegistered(
        address indexed actor, bytes32 indexed role, string name, string country, uint256 registeredAt
    );

    // ─── Errors ─────────────────────────────────────────────────────────────
    error InvalidRole(bytes32 role);
    error AlreadyRegistered(address actor);
    error RequestAlreadyExists(address actor);
    error NoPendingRequest(address actor);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /// @notice Submit a request for one of the six institutional roles.
    /// @param role one of {BANCO_SANGRE, LABORATORIO, FRACCIONAMIENTO,
    ///             MEDICINA_TRANSFUSIONAL, AUDITOR, CERTIFICADOR} role hashes.
    /// @param name human-readable institution name.
    /// @param country ISO 3166-1 alpha-2 code (e.g. "AR", "BR").
    function requestRole(bytes32 role, string calldata name, string calldata country) external {
        if (!_isInstitutionalRole(role)) revert InvalidRole(role);
        if (_actors[msg.sender].registeredAt != 0) revert AlreadyRegistered(msg.sender);
        if (_pending[msg.sender].requestedAt != 0) revert RequestAlreadyExists(msg.sender);

        _pending[msg.sender] = PendingRequest({role: role, name: name, country: country, requestedAt: block.timestamp});
        emit RoleRequested(msg.sender, role, name, country);
    }

    /// @notice Admin approves a pending request and grants the AccessControl role.
    function approveRole(address actor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        PendingRequest memory req = _pending[actor];
        if (req.requestedAt == 0) revert NoPendingRequest(actor);

        _actors[actor] =
            Actor({addr: actor, role: req.role, name: req.name, country: req.country, registeredAt: block.timestamp});
        delete _pending[actor];

        _grantRole(req.role, actor);

        emit ActorRegistered(actor, req.role, req.name, req.country, block.timestamp);
        emit RoleApproved(actor, req.role, msg.sender);
    }

    /// @notice Admin rejects a pending request without granting any role.
    function rejectRole(address actor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        PendingRequest memory req = _pending[actor];
        if (req.requestedAt == 0) revert NoPendingRequest(actor);
        delete _pending[actor];
        emit RoleRejected(actor, req.role, msg.sender);
    }

    // ─── Views ──────────────────────────────────────────────────────────────

    /// @notice Returns the registered actor metadata. `registeredAt == 0` means
    ///         never registered.
    function actorOf(address addr) external view returns (Actor memory) {
        return _actors[addr];
    }

    /// @notice Returns the pending request for `addr`, if any.
    function pendingRequest(address addr) external view returns (PendingRequest memory) {
        return _pending[addr];
    }

    /// @notice True iff the actor is registered AND still holds its role.
    /// @dev Derived from `hasRole` so it stays consistent if admin revokes the
    ///      role via the inherited `AccessControl.revokeRole(bytes32,address)`.
    function isActive(address addr) public view returns (bool) {
        bytes32 role = _actors[addr].role;
        return role != bytes32(0) && hasRole(role, addr);
    }

    /// @dev Whitelist of institutional roles. Excludes `DEFAULT_ADMIN_ROLE`.
    function _isInstitutionalRole(bytes32 role) internal pure returns (bool) {
        return role == BANCO_SANGRE_ROLE || role == LABORATORIO_ROLE || role == FRACCIONAMIENTO_ROLE
            || role == MEDICINA_TRANSFUSIONAL_ROLE || role == AUDITOR_ROLE || role == CERTIFICADOR_ROLE;
    }
}
