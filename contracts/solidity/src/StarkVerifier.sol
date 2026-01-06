// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Poseidon.sol";

/// @title StarkVerifier - Solidity STARK verification for gas comparison
/// @notice Implements Poseidon hash and Merkle path verification
/// @dev Used as baseline for Stylus gas comparison benchmarks
contract StarkVerifier {
    /// @notice Last verified Merkle root
    uint256 public lastVerifiedRoot;

    /// @notice Last verification result
    bool public lastVerificationResult;

    /// @notice Total number of verifications performed
    uint256 public verificationCount;

    /// @notice Emitted when a Merkle proof is verified
    /// @param root The Merkle root that was verified
    /// @param leaf The leaf value that was verified
    /// @param result Whether the verification succeeded
    event MerkleVerified(uint256 indexed root, uint256 leaf, bool result);

    /// @notice Compute Poseidon hash of two inputs
    /// @param a First input element
    /// @param b Second input element
    /// @return hash The Poseidon hash result
    function poseidonHash(uint256 a, uint256 b) external pure returns (uint256 hash) {
        return Poseidon.hash2(a, b);
    }

    /// @notice Batch Poseidon hash for benchmarking
    /// @dev Hashes multiple pairs and returns results
    /// @param inputsA Array of first input elements
    /// @param inputsB Array of second input elements
    /// @return hashes Array of hash results
    function batchPoseidon(
        uint256[] calldata inputsA,
        uint256[] calldata inputsB
    ) external pure returns (uint256[] memory hashes) {
        require(inputsA.length == inputsB.length, "Length mismatch");

        hashes = new uint256[](inputsA.length);
        for (uint256 i = 0; i < inputsA.length; i++) {
            hashes[i] = Poseidon.hash2(inputsA[i], inputsB[i]);
        }
    }

    /// @notice Verify a Merkle path using Poseidon hash
    /// @dev Computes root by hashing leaf up the tree
    /// @param root Expected Merkle root
    /// @param leaf Leaf value to verify
    /// @param path Array of sibling hashes along the path
    /// @param indices Array of position indicators (false=left, true=right)
    /// @return valid True if the proof is valid
    function verifyMerklePath(
        uint256 root,
        uint256 leaf,
        uint256[] calldata path,
        bool[] calldata indices
    ) external returns (bool valid) {
        require(path.length == indices.length, "Path/indices length mismatch");

        uint256 current = leaf;

        for (uint256 i = 0; i < path.length; i++) {
            if (indices[i]) {
                // Current is on the right side
                current = Poseidon.hash2(path[i], current);
            } else {
                // Current is on the left side
                current = Poseidon.hash2(current, path[i]);
            }
        }

        valid = (current == root);

        // Store result
        lastVerifiedRoot = root;
        lastVerificationResult = valid;
        verificationCount++;

        emit MerkleVerified(root, leaf, valid);
    }

    /// @notice Get the last verification result
    /// @return root Last verified root
    /// @return result Last verification result
    function getLastResult() external view returns (uint256 root, bool result) {
        return (lastVerifiedRoot, lastVerificationResult);
    }

    /// @notice Get total verification count
    /// @return count Number of verifications performed
    function getVerificationCount() external view returns (uint256 count) {
        return verificationCount;
    }

    /// @notice Benchmark helper: compute N sequential Poseidon hashes
    /// @dev Useful for measuring gas consumption at scale
    /// @param iterations Number of hash iterations
    /// @param seedA First seed value
    /// @param seedB Second seed value
    /// @return result Final hash after all iterations
    function benchmarkHash(
        uint32 iterations,
        uint256 seedA,
        uint256 seedB
    ) external pure returns (uint256 result) {
        result = Poseidon.hash2(seedA, seedB);
        for (uint32 i = 1; i < iterations; i++) {
            result = Poseidon.hash2(result, seedB);
        }
    }
}
