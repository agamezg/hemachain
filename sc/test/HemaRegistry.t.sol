// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {HemaRegistry} from "../src/HemaRegistry.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

contract HemaRegistryTest is Test {
    HemaRegistry internal registry;

    address internal admin;
    address internal banco;
    address internal lab;
    address internal frac;
    address internal mt;
    address internal auditor;
    address internal cert;
    address internal alice;

    bytes32 internal constant DEFAULT_ADMIN_ROLE = 0x00;

    // Local copies of the role constants so they can be passed as call arguments
    // without consuming a `vm.prank` on the same line. The
    // `test_RoleConstants_AreKeccak256OfName` test guards against drift from
    // the values defined in HemaRegistry.
    bytes32 internal constant BANCO_SANGRE_ROLE = keccak256("BANCO_SANGRE");
    bytes32 internal constant LABORATORIO_ROLE = keccak256("LABORATORIO");

    // Mirror of the events emitted by HemaRegistry, for vm.expectEmit.
    event RoleRequested(address indexed actor, bytes32 indexed role, string name, string country);
    event RoleApproved(address indexed actor, bytes32 indexed role, address indexed admin);
    event RoleRejected(address indexed actor, bytes32 indexed role, address indexed admin);
    event ActorRegistered(
        address indexed actor, bytes32 indexed role, string name, string country, uint256 registeredAt
    );

    function setUp() public {
        admin = makeAddr("admin");
        banco = makeAddr("banco");
        lab = makeAddr("lab");
        frac = makeAddr("frac");
        mt = makeAddr("mt");
        auditor = makeAddr("auditor");
        cert = makeAddr("cert");
        alice = makeAddr("alice");

        registry = new HemaRegistry(admin);
    }

    // ─── Deployment ────────────────────────────────────────────────────────

    function test_Deploy_AdminHasDefaultAdminRole() public view {
        assertTrue(registry.hasRole(DEFAULT_ADMIN_ROLE, admin));
    }

    function test_Deploy_AdminLacksInstitutionalRoles() public view {
        assertFalse(registry.hasRole(registry.BANCO_SANGRE_ROLE(), admin));
        assertFalse(registry.hasRole(registry.LABORATORIO_ROLE(), admin));
    }

    function test_RoleConstants_AreKeccak256OfName() public view {
        assertEq(registry.BANCO_SANGRE_ROLE(), keccak256("BANCO_SANGRE"));
        assertEq(registry.LABORATORIO_ROLE(), keccak256("LABORATORIO"));
        assertEq(registry.FRACCIONAMIENTO_ROLE(), keccak256("FRACCIONAMIENTO"));
        assertEq(registry.MEDICINA_TRANSFUSIONAL_ROLE(), keccak256("MEDICINA_TRANSFUSIONAL"));
        assertEq(registry.AUDITOR_ROLE(), keccak256("AUDITOR"));
        assertEq(registry.CERTIFICADOR_ROLE(), keccak256("CERTIFICADOR"));
        // Local mirrors must stay in sync with the on-chain constants.
        assertEq(BANCO_SANGRE_ROLE, registry.BANCO_SANGRE_ROLE());
        assertEq(LABORATORIO_ROLE, registry.LABORATORIO_ROLE());
    }

    // ─── requestRole ───────────────────────────────────────────────────────

    function test_RequestRole_StoresPending() public {
        vm.prank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");

        HemaRegistry.PendingRequest memory p = registry.pendingRequest(banco);
        assertEq(p.role, BANCO_SANGRE_ROLE);
        assertEq(p.name, "Banco Garrahan");
        assertEq(p.country, "AR");
        assertEq(p.requestedAt, block.timestamp);
    }

    function test_RequestRole_EmitsEvent() public {
        vm.expectEmit(true, true, false, true, address(registry));
        emit RoleRequested(banco, BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");

        vm.prank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");
    }

    function test_RequestRole_RevertsOnUnknownRole() public {
        bytes32 unknown = keccak256("MARKETING");
        vm.prank(banco);
        vm.expectRevert(abi.encodeWithSelector(HemaRegistry.InvalidRole.selector, unknown));
        registry.requestRole(unknown, "X", "AR");
    }

    function test_RequestRole_RevertsOnDefaultAdminRole() public {
        vm.prank(banco);
        vm.expectRevert(abi.encodeWithSelector(HemaRegistry.InvalidRole.selector, DEFAULT_ADMIN_ROLE));
        registry.requestRole(DEFAULT_ADMIN_ROLE, "X", "AR");
    }

    function test_RequestRole_RevertsOnDuplicatePending() public {
        vm.startPrank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");
        vm.expectRevert(abi.encodeWithSelector(HemaRegistry.RequestAlreadyExists.selector, banco));
        registry.requestRole(LABORATORIO_ROLE, "X", "AR");
        vm.stopPrank();
    }

    function test_RequestRole_RevertsIfAlreadyApproved() public {
        vm.prank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");
        vm.prank(admin);
        registry.approveRole(banco);

        vm.prank(banco);
        vm.expectRevert(abi.encodeWithSelector(HemaRegistry.AlreadyRegistered.selector, banco));
        registry.requestRole(LABORATORIO_ROLE, "X", "AR");
    }

    // ─── approveRole ───────────────────────────────────────────────────────

    function test_ApproveRole_GrantsAccessControlRole() public {
        vm.prank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");

        vm.prank(admin);
        registry.approveRole(banco);

        assertTrue(registry.hasRole(BANCO_SANGRE_ROLE, banco));
    }

    function test_ApproveRole_RegistersActor() public {
        vm.prank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");

        vm.prank(admin);
        registry.approveRole(banco);

        HemaRegistry.Actor memory a = registry.actorOf(banco);
        assertEq(a.addr, banco);
        assertEq(a.role, BANCO_SANGRE_ROLE);
        assertEq(a.name, "Banco Garrahan");
        assertEq(a.country, "AR");
        assertGt(a.registeredAt, 0);
    }

    function test_ApproveRole_DeletesPending() public {
        vm.prank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");

        vm.prank(admin);
        registry.approveRole(banco);

        HemaRegistry.PendingRequest memory p = registry.pendingRequest(banco);
        assertEq(p.requestedAt, 0);
    }

    function test_ApproveRole_EmitsActorRegistered() public {
        vm.prank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");

        vm.expectEmit(true, true, false, true, address(registry));
        emit ActorRegistered(banco, BANCO_SANGRE_ROLE, "Banco Garrahan", "AR", block.timestamp);

        vm.prank(admin);
        registry.approveRole(banco);
    }

    function test_ApproveRole_RevertsForNonAdmin() public {
        vm.prank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, DEFAULT_ADMIN_ROLE)
        );
        registry.approveRole(banco);
    }

    function test_ApproveRole_RevertsOnNoPending() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(HemaRegistry.NoPendingRequest.selector, banco));
        registry.approveRole(banco);
    }

    // ─── rejectRole ────────────────────────────────────────────────────────

    function test_RejectRole_DeletesPending() public {
        vm.prank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");

        vm.prank(admin);
        registry.rejectRole(banco);

        HemaRegistry.PendingRequest memory p = registry.pendingRequest(banco);
        assertEq(p.requestedAt, 0);
    }

    function test_RejectRole_DoesNotGrantRole() public {
        vm.prank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");

        vm.prank(admin);
        registry.rejectRole(banco);

        assertFalse(registry.hasRole(BANCO_SANGRE_ROLE, banco));
    }

    function test_RejectRole_RevertsForNonAdmin() public {
        vm.prank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, DEFAULT_ADMIN_ROLE)
        );
        registry.rejectRole(banco);
    }

    function test_RejectRole_AllowsResubmission() public {
        vm.prank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");
        vm.prank(admin);
        registry.rejectRole(banco);

        vm.prank(banco);
        registry.requestRole(LABORATORIO_ROLE, "Lab Garrahan", "AR");
        assertEq(registry.pendingRequest(banco).role, LABORATORIO_ROLE);
    }

    // ─── revokeRole (inherited from AccessControl) ─────────────────────────

    function test_RevokeRole_RemovesAccessControlRole() public {
        vm.prank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");
        vm.prank(admin);
        registry.approveRole(banco);

        vm.prank(admin);
        registry.revokeRole(BANCO_SANGRE_ROLE, banco);

        assertFalse(registry.hasRole(BANCO_SANGRE_ROLE, banco));
    }

    function test_RevokeRole_FlipsIsActiveDerived() public {
        vm.prank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");
        vm.prank(admin);
        registry.approveRole(banco);
        assertTrue(registry.isActive(banco));

        vm.prank(admin);
        registry.revokeRole(BANCO_SANGRE_ROLE, banco);

        assertFalse(registry.isActive(banco));
    }

    function test_RevokeRole_PreservesActorRecord() public {
        vm.prank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");
        vm.prank(admin);
        registry.approveRole(banco);

        vm.prank(admin);
        registry.revokeRole(BANCO_SANGRE_ROLE, banco);

        HemaRegistry.Actor memory a = registry.actorOf(banco);
        assertEq(a.addr, banco);
        assertGt(a.registeredAt, 0);
    }

    // ─── isActive ──────────────────────────────────────────────────────────

    function test_IsActive_FalseForUnknown() public view {
        assertFalse(registry.isActive(alice));
    }

    function test_IsActive_FalseAfterRequestOnly() public {
        vm.prank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");
        assertFalse(registry.isActive(banco));
    }

    function test_IsActive_TrueAfterApproval() public {
        vm.prank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");
        vm.prank(admin);
        registry.approveRole(banco);
        assertTrue(registry.isActive(banco));
    }

    // ─── Enumerable ────────────────────────────────────────────────────────

    function test_Enumerable_ListsHoldersByRole() public {
        bytes32 bancoRole = BANCO_SANGRE_ROLE;

        vm.prank(banco);
        registry.requestRole(bancoRole, "Banco Garrahan", "AR");
        vm.prank(admin);
        registry.approveRole(banco);

        vm.prank(lab);
        registry.requestRole(bancoRole, "Banco Italiano", "AR");
        vm.prank(admin);
        registry.approveRole(lab);

        assertEq(registry.getRoleMemberCount(bancoRole), 2);
        assertEq(registry.getRoleMember(bancoRole, 0), banco);
        assertEq(registry.getRoleMember(bancoRole, 1), lab);
    }
}
