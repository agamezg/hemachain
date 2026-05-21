// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {HemaRegistry} from "../src/HemaRegistry.sol";
import {HemaTraceability} from "../src/HemaTraceability.sol";
import {HemaCertificate} from "../src/HemaCertificate.sol";

/**
 * @title Deploy
 * @notice Deploys the three HemaChain contracts. The deployer becomes the
 *         HemaRegistry admin.
 * @dev Run locally against Anvil:
 *      forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
 *
 *      In production, supply DEPLOYER_PRIVATE_KEY env var instead of relying
 *      on the default Anvil account.
 */
contract Deploy is Script {
    // First Anvil account — used when DEPLOYER_PRIVATE_KEY env var is absent.
    uint256 internal constant ANVIL_PK = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    function run() external returns (HemaRegistry registry, HemaTraceability trace, HemaCertificate cert) {
        uint256 pk = vm.envOr("DEPLOYER_PRIVATE_KEY", ANVIL_PK);
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);
        registry = new HemaRegistry(deployer);
        trace = new HemaTraceability(address(registry));
        cert = new HemaCertificate(address(registry));
        vm.stopBroadcast();

        console2.log("Admin:           ", deployer);
        console2.log("HemaRegistry:    ", address(registry));
        console2.log("HemaTraceability:", address(trace));
        console2.log("HemaCertificate: ", address(cert));
    }
}
