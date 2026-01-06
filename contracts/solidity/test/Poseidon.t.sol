// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Poseidon.sol";

contract PoseidonTest is Test {
    /// @notice Test circomlib compatibility
    /// @dev Test vector: poseidon([1, 2]) = 0x115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a
    function test_CircomlibCompatibility() public pure {
        uint256 a = 1;
        uint256 b = 2;
        uint256 expected = 0x115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a;

        uint256 result = Poseidon.hash2(a, b);

        assertEq(result, expected, "Poseidon hash does not match circomlib test vector");
    }

    /// @notice Test determinism
    function test_Deterministic() public pure {
        uint256 a = 123456789;
        uint256 b = 987654321;

        uint256 hash1 = Poseidon.hash2(a, b);
        uint256 hash2 = Poseidon.hash2(a, b);

        assertEq(hash1, hash2, "Hash should be deterministic");
    }

    /// @notice Test different inputs produce different outputs
    function test_DifferentInputs() public pure {
        uint256 hash1 = Poseidon.hash2(1, 2);
        uint256 hash2 = Poseidon.hash2(2, 1);

        assertTrue(hash1 != hash2, "Different inputs should produce different outputs");
    }

    /// @notice Test zero inputs
    function test_ZeroInputs() public pure {
        uint256 result = Poseidon.hash2(0, 0);
        assertTrue(result != 0, "Hash of zeros should not be zero");
    }
}
