// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title Codes
 * @notice Constants and pure helpers for ISBT 128 ABO/Rh codes, blood
 *         component shelf lives, and cold-chain temperature ranges.
 * @dev Library — no state. Imported by HemaTraceability so the enum and
 *      helpers live in one place. Shelf lives follow Res. 865/2006 (AR) and
 *      AABB Technical Manual; temperature ranges follow ISBT 128 storage
 *      codes. Temperatures are whole-degree Celsius (`int16`) per SDD §7.1.
 */
library Codes {
    /// @notice Blood components produced from a whole-blood donation.
    /// @dev `Unknown` is the zero value so an uninitialised `ComponentType`
    ///      slot is detectably invalid.
    enum ComponentType {
        Unknown,
        RBC, // Red Blood Cells (Glóbulos Rojos)
        FFP, // Fresh Frozen Plasma (Plasma Fresco Congelado)
        PLT, // Platelet Concentrate (Concentrado de Plaquetas)
        CRYO // Cryoprecipitate (Crioprecipitado)
    }

    // ─── ABO / Rh codes (ASCII, packed into bytes8) ────────────────────────
    bytes8 internal constant ABO_A_POS = bytes8("A+");
    bytes8 internal constant ABO_A_NEG = bytes8("A-");
    bytes8 internal constant ABO_B_POS = bytes8("B+");
    bytes8 internal constant ABO_B_NEG = bytes8("B-");
    bytes8 internal constant ABO_AB_POS = bytes8("AB+");
    bytes8 internal constant ABO_AB_NEG = bytes8("AB-");
    bytes8 internal constant ABO_O_POS = bytes8("O+");
    bytes8 internal constant ABO_O_NEG = bytes8("O-");

    // ─── Shelf life by component type (days) ───────────────────────────────
    uint16 internal constant SHELF_LIFE_RBC_DAYS = 42;
    uint16 internal constant SHELF_LIFE_FFP_DAYS = 365;
    uint16 internal constant SHELF_LIFE_PLT_DAYS = 5;
    uint16 internal constant SHELF_LIFE_CRYO_DAYS = 365;

    // ─── Storage / transport temperature ranges (°C, whole degrees) ────────
    int16 internal constant TEMP_RBC_MIN = 2;
    int16 internal constant TEMP_RBC_MAX = 6;
    int16 internal constant TEMP_FFP_MIN = -30;
    int16 internal constant TEMP_FFP_MAX = -18;
    int16 internal constant TEMP_PLT_MIN = 20;
    int16 internal constant TEMP_PLT_MAX = 24;
    int16 internal constant TEMP_CRYO_MIN = -30;
    int16 internal constant TEMP_CRYO_MAX = -18;

    error UnknownComponentType();

    /// @notice Shelf life in days for the given component type.
    function shelfLifeDays(ComponentType c) internal pure returns (uint16) {
        if (c == ComponentType.RBC) return SHELF_LIFE_RBC_DAYS;
        if (c == ComponentType.FFP) return SHELF_LIFE_FFP_DAYS;
        if (c == ComponentType.PLT) return SHELF_LIFE_PLT_DAYS;
        if (c == ComponentType.CRYO) return SHELF_LIFE_CRYO_DAYS;
        revert UnknownComponentType();
    }

    /// @notice Absolute expiry timestamp (`producedAt + shelfLife`).
    function expiryAt(ComponentType c, uint256 producedAt) internal pure returns (uint256) {
        return producedAt + uint256(shelfLifeDays(c)) * 1 days;
    }

    /// @notice True iff `tempCelsius` is within the allowed storage range
    ///         for the component (inclusive at both ends).
    function isTempInRange(ComponentType c, int16 tempCelsius) internal pure returns (bool) {
        if (c == ComponentType.RBC) return tempCelsius >= TEMP_RBC_MIN && tempCelsius <= TEMP_RBC_MAX;
        if (c == ComponentType.FFP) return tempCelsius >= TEMP_FFP_MIN && tempCelsius <= TEMP_FFP_MAX;
        if (c == ComponentType.PLT) return tempCelsius >= TEMP_PLT_MIN && tempCelsius <= TEMP_PLT_MAX;
        if (c == ComponentType.CRYO) return tempCelsius >= TEMP_CRYO_MIN && tempCelsius <= TEMP_CRYO_MAX;
        revert UnknownComponentType();
    }

    /// @notice True iff `code` is one of the eight canonical ABO/Rh values.
    function isValidAboRh(bytes8 code) internal pure returns (bool) {
        return code == ABO_A_POS || code == ABO_A_NEG || code == ABO_B_POS || code == ABO_B_NEG || code == ABO_AB_POS
            || code == ABO_AB_NEG || code == ABO_O_POS || code == ABO_O_NEG;
    }
}
