// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {StarkVerifier} from "../src/StarkVerifier.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        console.log("========================================");
        console.log("  STARK Solidity Verifier - Deployment");
        console.log("========================================");
        console.log("");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Chain ID:", block.chainid);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        StarkVerifier verifier = new StarkVerifier();

        vm.stopBroadcast();

        console.log("========================================");
        console.log("  Deployment Successful!");
        console.log("========================================");
        console.log("StarkVerifier deployed at:", address(verifier));
        console.log("");
        console.log("Update lib/contracts.ts with:");
        console.log("  SOLIDITY_VERIFIER_ADDRESS =", address(verifier));
    }
}
