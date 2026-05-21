// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {HemaRegistry} from "./HemaRegistry.sol";

/**
 * @title HemaCertificate
 * @notice ERC-721 certificates (AAHITC, ISO 15189, ANMAT, GMP, …) emitted by
 *         the CERTIFICADOR role. Each token stores a `documentHash`
 *         (= `keccak256(PDF)`) and an IPFS CID; the frontend re-hashes the
 *         PDF before rendering it to prove the on-chain commitment matches.
 * @dev Status transitions are monotonic per SDD §8.3 (INV_CertificateMonotonic):
 *      `Valid → Expired | Revoked`, both terminal. Calling `revokeCertificate`
 *      on a token that has already expired is rejected — the certificate is
 *      already in a terminal state.
 *
 *      Role checks delegate to HemaRegistry (single source of truth) — no
 *      AccessControl roles are stored locally.
 */
contract HemaCertificate is ERC721URIStorage {
    HemaRegistry public immutable registry;

    enum CertType {
        AAHITC,
        ISO15189,
        ANMAT,
        GMP,
        OTHER
    }

    enum CertStatus {
        Valid,
        Expired,
        Revoked
    }

    struct Metadata {
        CertType certType;
        address issuer;
        uint256 issuedAt;
        uint256 expiresAt;
        bytes32 documentHash;
        string ipfsCID;
        bool revoked;
        string revocationReason;
    }

    uint256 private _nextTokenId = 1;
    mapping(uint256 => Metadata) private _metadata;

    event CertificateIssued(
        uint256 indexed tokenId,
        address indexed subject,
        address indexed issuer,
        CertType certType,
        uint256 expiresAt,
        bytes32 documentHash,
        string ipfsCID
    );
    event CertificateRevoked(uint256 indexed tokenId, address indexed issuer, string reason);

    error NotCertificador(address caller);
    error InvalidSubject();
    error InvalidExpiry(uint256 expiresAt, uint256 nowTs);
    error EmptyDocumentHash();
    error EmptyCID();
    error TokenNotFound(uint256 tokenId);
    error AlreadyRevoked(uint256 tokenId);
    error AlreadyExpired(uint256 tokenId);

    constructor(address registry_) ERC721("HemaCertificate", "HEMA-CERT") {
        registry = HemaRegistry(registry_);
    }

    modifier onlyCertificador() {
        if (!registry.hasRole(registry.CERTIFICADOR_ROLE(), msg.sender)) {
            revert NotCertificador(msg.sender);
        }
        _;
    }

    /// @notice Mint a new certificate NFT to `subject`.
    /// @param subject the institution being certified.
    /// @param certType type of accreditation.
    /// @param expiresAt absolute expiry timestamp (must be in the future).
    /// @param documentHash `keccak256` of the canonical PDF.
    /// @param ipfsCID IPFS content identifier where the PDF lives.
    function issueCertificate(
        address subject,
        CertType certType,
        uint256 expiresAt,
        bytes32 documentHash,
        string calldata ipfsCID
    ) external onlyCertificador returns (uint256 tokenId) {
        if (subject == address(0)) revert InvalidSubject();
        if (expiresAt <= block.timestamp) revert InvalidExpiry(expiresAt, block.timestamp);
        if (documentHash == bytes32(0)) revert EmptyDocumentHash();
        if (bytes(ipfsCID).length == 0) revert EmptyCID();

        tokenId = _nextTokenId++;
        _safeMint(subject, tokenId);
        _setTokenURI(tokenId, string.concat("ipfs://", ipfsCID));

        _metadata[tokenId] = Metadata({
            certType: certType,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            documentHash: documentHash,
            ipfsCID: ipfsCID,
            revoked: false,
            revocationReason: ""
        });

        emit CertificateIssued(tokenId, subject, msg.sender, certType, expiresAt, documentHash, ipfsCID);
    }

    /// @notice Revoke a certificate. Only valid while the token is `Valid` —
    ///         once expired, status is already terminal (INV_CertificateMonotonic).
    function revokeCertificate(uint256 tokenId, string calldata reason) external onlyCertificador {
        _requireMinted(tokenId);
        Metadata storage m = _metadata[tokenId];
        if (m.revoked) revert AlreadyRevoked(tokenId);
        if (block.timestamp >= m.expiresAt) revert AlreadyExpired(tokenId);

        m.revoked = true;
        m.revocationReason = reason;
        emit CertificateRevoked(tokenId, msg.sender, reason);
    }

    /// @notice Current monotonic status of a certificate.
    function statusOf(uint256 tokenId) public view returns (CertStatus) {
        _requireMinted(tokenId);
        Metadata storage m = _metadata[tokenId];
        if (m.revoked) return CertStatus.Revoked;
        if (block.timestamp >= m.expiresAt) return CertStatus.Expired;
        return CertStatus.Valid;
    }

    /// @notice Returns the full on-chain metadata for a token.
    function metadataOf(uint256 tokenId) external view returns (Metadata memory) {
        _requireMinted(tokenId);
        return _metadata[tokenId];
    }

    /// @dev Internal helper — OZ v5 removed `_exists`; we use `_ownerOf`.
    function _requireMinted(uint256 tokenId) internal view {
        if (_ownerOf(tokenId) == address(0)) revert TokenNotFound(tokenId);
    }
}
