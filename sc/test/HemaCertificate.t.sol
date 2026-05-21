// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {HemaRegistry} from "../src/HemaRegistry.sol";
import {HemaCertificate} from "../src/HemaCertificate.sol";

contract HemaCertificateTest is Test {
    HemaRegistry internal registry;
    HemaCertificate internal cert;

    address internal admin;
    address internal certificador;
    address internal banco;
    address internal outsider;

    bytes32 internal constant BANCO_SANGRE_ROLE = keccak256("BANCO_SANGRE");
    bytes32 internal constant CERTIFICADOR_ROLE = keccak256("CERTIFICADOR");

    bytes32 internal constant DOC_HASH = keccak256("pdf-payload-v1");
    string internal constant CID = "QmTestCidExampleHashValue123";

    function setUp() public {
        admin = makeAddr("admin");
        certificador = makeAddr("certificador");
        banco = makeAddr("banco");
        outsider = makeAddr("outsider");

        registry = new HemaRegistry(admin);
        cert = new HemaCertificate(address(registry));

        vm.prank(certificador);
        registry.requestRole(CERTIFICADOR_ROLE, "AAHITC", "AR");
        vm.prank(admin);
        registry.approveRole(certificador);

        vm.prank(banco);
        registry.requestRole(BANCO_SANGRE_ROLE, "Banco Garrahan", "AR");
        vm.prank(admin);
        registry.approveRole(banco);
    }

    function _issue(address subject, uint256 expiresAt) internal returns (uint256 tokenId) {
        vm.prank(certificador);
        tokenId = cert.issueCertificate(subject, HemaCertificate.CertType.AAHITC, expiresAt, DOC_HASH, CID);
    }

    // ─── Deployment / Metadata ─────────────────────────────────────────────

    function test_Deploy_NameAndSymbol() public view {
        assertEq(cert.name(), "HemaCertificate");
        assertEq(cert.symbol(), "HEMA-CERT");
    }

    function test_Deploy_BindsRegistry() public view {
        assertEq(address(cert.registry()), address(registry));
    }

    // ─── issueCertificate ──────────────────────────────────────────────────

    function test_IssueCertificate_MintsToSubject() public {
        uint256 id = _issue(banco, block.timestamp + 365 days);
        assertEq(cert.ownerOf(id), banco);
        assertEq(cert.balanceOf(banco), 1);
    }

    function test_IssueCertificate_StoresMetadata() public {
        uint256 expiry = block.timestamp + 365 days;
        uint256 id = _issue(banco, expiry);

        HemaCertificate.Metadata memory m = cert.metadataOf(id);
        assertEq(uint256(m.certType), uint256(HemaCertificate.CertType.AAHITC));
        assertEq(m.issuer, certificador);
        assertEq(m.issuedAt, block.timestamp);
        assertEq(m.expiresAt, expiry);
        assertEq(m.documentHash, DOC_HASH);
        assertEq(m.ipfsCID, CID);
        assertFalse(m.revoked);
    }

    function test_IssueCertificate_TokenURIPointsAtIpfs() public {
        uint256 id = _issue(banco, block.timestamp + 365 days);
        assertEq(cert.tokenURI(id), string.concat("ipfs://", CID));
    }

    function test_IssueCertificate_RevertsForNonCertificador() public {
        vm.prank(banco);
        vm.expectRevert(abi.encodeWithSelector(HemaCertificate.NotCertificador.selector, banco));
        cert.issueCertificate(banco, HemaCertificate.CertType.AAHITC, block.timestamp + 365 days, DOC_HASH, CID);
    }

    function test_IssueCertificate_RevertsForZeroSubject() public {
        vm.prank(certificador);
        vm.expectRevert(HemaCertificate.InvalidSubject.selector);
        cert.issueCertificate(address(0), HemaCertificate.CertType.AAHITC, block.timestamp + 365 days, DOC_HASH, CID);
    }

    function test_IssueCertificate_RevertsForPastExpiry() public {
        vm.warp(1_000_000);
        vm.prank(certificador);
        vm.expectRevert(abi.encodeWithSelector(HemaCertificate.InvalidExpiry.selector, 1_000_000, 1_000_000));
        cert.issueCertificate(banco, HemaCertificate.CertType.AAHITC, 1_000_000, DOC_HASH, CID);
    }

    function test_IssueCertificate_RevertsForEmptyDocHash() public {
        vm.prank(certificador);
        vm.expectRevert(HemaCertificate.EmptyDocumentHash.selector);
        cert.issueCertificate(banco, HemaCertificate.CertType.AAHITC, block.timestamp + 365 days, bytes32(0), CID);
    }

    function test_IssueCertificate_RevertsForEmptyCID() public {
        vm.prank(certificador);
        vm.expectRevert(HemaCertificate.EmptyCID.selector);
        cert.issueCertificate(banco, HemaCertificate.CertType.AAHITC, block.timestamp + 365 days, DOC_HASH, "");
    }

    // ─── statusOf ──────────────────────────────────────────────────────────

    function test_StatusOf_ValidImmediatelyAfterIssue() public {
        uint256 id = _issue(banco, block.timestamp + 365 days);
        assertEq(uint256(cert.statusOf(id)), uint256(HemaCertificate.CertStatus.Valid));
    }

    function test_StatusOf_ExpiredAfterExpiryTimestamp() public {
        uint256 expiry = block.timestamp + 365 days;
        uint256 id = _issue(banco, expiry);
        vm.warp(expiry);
        assertEq(uint256(cert.statusOf(id)), uint256(HemaCertificate.CertStatus.Expired));
    }

    function test_StatusOf_RevokedDominatesExpired() public {
        // Cert in Valid window → revoke → check status.
        uint256 id = _issue(banco, block.timestamp + 365 days);
        vm.prank(certificador);
        cert.revokeCertificate(id, "compliance breach");
        assertEq(uint256(cert.statusOf(id)), uint256(HemaCertificate.CertStatus.Revoked));
        // Even after the original expiry passes, status stays Revoked (terminal).
        vm.warp(block.timestamp + 366 days);
        assertEq(uint256(cert.statusOf(id)), uint256(HemaCertificate.CertStatus.Revoked));
    }

    function test_StatusOf_RevertsForUnknownToken() public {
        vm.expectRevert(abi.encodeWithSelector(HemaCertificate.TokenNotFound.selector, 999));
        cert.statusOf(999);
    }

    // ─── revokeCertificate ─────────────────────────────────────────────────

    function test_RevokeCertificate_HappyPath() public {
        uint256 id = _issue(banco, block.timestamp + 365 days);
        vm.prank(certificador);
        cert.revokeCertificate(id, "breach");

        HemaCertificate.Metadata memory m = cert.metadataOf(id);
        assertTrue(m.revoked);
        assertEq(m.revocationReason, "breach");
    }

    function test_RevokeCertificate_RevertsForNonCertificador() public {
        uint256 id = _issue(banco, block.timestamp + 365 days);
        vm.prank(banco);
        vm.expectRevert(abi.encodeWithSelector(HemaCertificate.NotCertificador.selector, banco));
        cert.revokeCertificate(id, "x");
    }

    function test_RevokeCertificate_RevertsIfAlreadyRevoked() public {
        uint256 id = _issue(banco, block.timestamp + 365 days);
        vm.prank(certificador);
        cert.revokeCertificate(id, "first");

        vm.prank(certificador);
        vm.expectRevert(abi.encodeWithSelector(HemaCertificate.AlreadyRevoked.selector, id));
        cert.revokeCertificate(id, "second");
    }

    function test_RevokeCertificate_RevertsIfAlreadyExpired() public {
        // INV_CertificateMonotonic: Expired is terminal — can't move to Revoked.
        uint256 expiry = block.timestamp + 365 days;
        uint256 id = _issue(banco, expiry);
        vm.warp(expiry);
        vm.prank(certificador);
        vm.expectRevert(abi.encodeWithSelector(HemaCertificate.AlreadyExpired.selector, id));
        cert.revokeCertificate(id, "too late");
    }

    function test_RevokeCertificate_RevertsForUnknownToken() public {
        vm.prank(certificador);
        vm.expectRevert(abi.encodeWithSelector(HemaCertificate.TokenNotFound.selector, 999));
        cert.revokeCertificate(999, "x");
    }

    // ─── ERC-721 sanity ─────────────────────────────────────────────────────

    function test_OwnerCanTransferToken() public {
        uint256 id = _issue(banco, block.timestamp + 365 days);
        address newOwner = makeAddr("newOwner");
        vm.prank(banco);
        cert.transferFrom(banco, newOwner, id);
        assertEq(cert.ownerOf(id), newOwner);
        // Even when transferred, status is unchanged.
        assertEq(uint256(cert.statusOf(id)), uint256(HemaCertificate.CertStatus.Valid));
    }
}
