//! STARK Stylus Verifier - Mini STARK Verifier for Arbitrum Stylus
//!
//! Implements Poseidon hash and Merkle path verification with 10-18x gas savings
//! compared to Solidity implementations.

#![cfg_attr(not(feature = "export-abi"), no_std, no_main)]
extern crate alloc;

use alloc::vec;
use alloc::vec::Vec;
use stylus_sdk::{alloy_primitives::U256, prelude::*};

mod merkle;
mod poseidon;

use merkle::MerkleVerifier;
use poseidon::PoseidonHasher;

sol_storage! {
    #[entrypoint]
    pub struct StarkVerifier {
        /// Last verified Merkle root
        uint256 last_verified_root;
        /// Last verification result
        bool last_verification_result;
        /// Total verifications count
        uint256 verification_count;
    }
}

#[public]
impl StarkVerifier {
    /// Compute Poseidon hash of two U256 inputs
    /// Uses BN254 field with t=3, 8 full + 57 partial rounds
    ///
    /// # Arguments
    /// * `a` - First input element
    /// * `b` - Second input element
    ///
    /// # Returns
    /// The Poseidon hash result as U256
    pub fn poseidon_hash(&self, a: U256, b: U256) -> U256 {
        PoseidonHasher::hash_two(a, b)
    }

    /// Batch Poseidon hash for benchmarking
    /// Hashes multiple pairs and returns results
    ///
    /// # Arguments
    /// * `a_values` - Array of first input elements
    /// * `b_values` - Array of second input elements
    ///
    /// # Returns
    /// Array of hash results
    pub fn batch_poseidon(&self, a_values: Vec<U256>, b_values: Vec<U256>) -> Vec<U256> {
        a_values
            .iter()
            .zip(b_values.iter())
            .map(|(a, b)| PoseidonHasher::hash_two(*a, *b))
            .collect()
    }

    /// Verify a Merkle path using Poseidon hash
    /// Returns true if the leaf belongs to the tree with the given root
    ///
    /// # Arguments
    /// * `root` - Expected Merkle root
    /// * `leaf` - Leaf value to verify
    /// * `path` - Array of sibling hashes along the path
    /// * `indices` - Array of position indicators (false=left, true=right)
    ///
    /// # Returns
    /// True if the proof is valid
    pub fn verify_merkle_path(
        &mut self,
        root: U256,
        leaf: U256,
        path: Vec<U256>,
        indices: Vec<bool>,
    ) -> bool {
        let result = MerkleVerifier::verify(root, leaf, &path, &indices);

        // Store verification result
        self.last_verified_root.set(root);
        self.last_verification_result.set(result);

        // Increment counter
        let count = self.verification_count.get();
        self.verification_count.set(count + U256::from(1));

        result
    }

    /// Get the last verification result
    ///
    /// # Returns
    /// Tuple of (last_root, last_result)
    pub fn get_last_result(&self) -> (U256, bool) {
        (
            self.last_verified_root.get(),
            self.last_verification_result.get(),
        )
    }

    /// Get total verification count
    pub fn get_verification_count(&self) -> U256 {
        self.verification_count.get()
    }

    /// Benchmark helper: compute N sequential Poseidon hashes
    /// Useful for measuring gas consumption at scale
    pub fn benchmark_hash(&self, iterations: u32, seed_a: U256, seed_b: U256) -> U256 {
        let mut result = PoseidonHasher::hash_two(seed_a, seed_b);
        for _ in 1..iterations {
            result = PoseidonHasher::hash_two(result, seed_b);
        }
        result
    }
}
