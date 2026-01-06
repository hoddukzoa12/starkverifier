//! Merkle Path Verification
//!
//! Implements Merkle tree path verification using Poseidon hash.
//! Supports verification of membership proofs for trees of any depth.

use alloy_primitives::U256;

use crate::poseidon::PoseidonHasher;

/// Merkle path verifier using Poseidon hash
pub struct MerkleVerifier;

impl MerkleVerifier {
    /// Verify a Merkle proof
    ///
    /// Computes the root by hashing the leaf up the tree using the provided
    /// sibling hashes and position indicators.
    ///
    /// # Arguments
    /// * `root` - Expected Merkle root
    /// * `leaf` - Leaf value to verify
    /// * `path` - Array of sibling hashes along the path from leaf to root
    /// * `indices` - Position indicators for each level (false=left, true=right)
    ///
    /// # Returns
    /// `true` if the computed root matches the expected root
    ///
    /// # Example
    /// For a tree:
    /// ```text
    ///        root
    ///       /    \
    ///     h01    h23
    ///    /  \   /  \
    ///   l0  l1 l2  l3
    /// ```
    /// To verify l0:
    /// - leaf = l0
    /// - path = [l1, h23]
    /// - indices = [false, false] (l0 is left child at both levels)
    #[inline]
    pub fn verify(root: U256, leaf: U256, path: &[U256], indices: &[bool]) -> bool {
        // Path and indices must have same length
        if path.len() != indices.len() {
            return false;
        }

        // Empty path means leaf should equal root
        if path.is_empty() {
            return leaf == root;
        }

        let mut current = leaf;

        // Walk up the tree
        for (sibling, is_right) in path.iter().zip(indices.iter()) {
            current = if *is_right {
                // Current node is on the right side
                // Parent = hash(sibling, current)
                PoseidonHasher::hash_two(*sibling, current)
            } else {
                // Current node is on the left side
                // Parent = hash(current, sibling)
                PoseidonHasher::hash_two(current, *sibling)
            };
        }

        // Check if computed root matches expected root
        current == root
    }

    /// Compute Merkle root from leaves
    /// Helper function for testing - builds full tree and returns root
    ///
    /// # Arguments
    /// * `leaves` - Array of leaf values (must be power of 2)
    ///
    /// # Returns
    /// The Merkle root
    #[cfg(test)]
    pub fn compute_root(leaves: &[U256]) -> U256 {
        if leaves.is_empty() {
            return U256::ZERO;
        }
        if leaves.len() == 1 {
            return leaves[0];
        }

        let mut current_level: alloc::vec::Vec<U256> = leaves.to_vec();

        while current_level.len() > 1 {
            let mut next_level = alloc::vec::Vec::new();

            for chunk in current_level.chunks(2) {
                let left = chunk[0];
                let right = if chunk.len() > 1 { chunk[1] } else { chunk[0] };
                next_level.push(PoseidonHasher::hash_two(left, right));
            }

            current_level = next_level;
        }

        current_level[0]
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloc::vec;

    #[test]
    fn test_empty_path() {
        let leaf = U256::from(42u64);
        // With empty path, leaf should equal root
        assert!(MerkleVerifier::verify(leaf, leaf, &[], &[]));
        assert!(!MerkleVerifier::verify(U256::from(1u64), leaf, &[], &[]));
    }

    #[test]
    fn test_simple_two_leaf_tree() {
        let leaf0 = U256::from(100u64);
        let leaf1 = U256::from(200u64);

        // Root = hash(leaf0, leaf1)
        let root = PoseidonHasher::hash_two(leaf0, leaf1);

        // Verify leaf0 (left child)
        assert!(MerkleVerifier::verify(root, leaf0, &[leaf1], &[false]));

        // Verify leaf1 (right child)
        assert!(MerkleVerifier::verify(root, leaf1, &[leaf0], &[true]));
    }

    #[test]
    fn test_four_leaf_tree() {
        let leaves = [
            U256::from(1u64),
            U256::from(2u64),
            U256::from(3u64),
            U256::from(4u64),
        ];

        // Build tree:
        //        root
        //       /    \
        //     h01    h23
        //    /  \   /  \
        //   l0  l1 l2  l3

        let h01 = PoseidonHasher::hash_two(leaves[0], leaves[1]);
        let h23 = PoseidonHasher::hash_two(leaves[2], leaves[3]);
        let root = PoseidonHasher::hash_two(h01, h23);

        // Verify leaf0 (leftmost)
        assert!(MerkleVerifier::verify(
            root,
            leaves[0],
            &[leaves[1], h23],
            &[false, false]
        ));

        // Verify leaf3 (rightmost)
        assert!(MerkleVerifier::verify(
            root,
            leaves[3],
            &[leaves[2], h01],
            &[true, true]
        ));
    }

    #[test]
    fn test_invalid_proof() {
        let leaf0 = U256::from(100u64);
        let leaf1 = U256::from(200u64);
        let root = PoseidonHasher::hash_two(leaf0, leaf1);

        // Wrong sibling
        assert!(!MerkleVerifier::verify(
            root,
            leaf0,
            &[U256::from(999u64)],
            &[false]
        ));

        // Wrong position
        assert!(!MerkleVerifier::verify(root, leaf0, &[leaf1], &[true]));
    }

    #[test]
    fn test_path_indices_length_mismatch() {
        let root = U256::from(1u64);
        let leaf = U256::from(2u64);

        // Mismatched lengths should fail
        assert!(!MerkleVerifier::verify(
            root,
            leaf,
            &[U256::from(3u64), U256::from(4u64)],
            &[false]
        ));
    }

    #[test]
    fn test_depth_8_tree() {
        // Create 256 leaves
        let leaves: alloc::vec::Vec<U256> = (0..256u64).map(U256::from).collect();
        let root = MerkleVerifier::compute_root(&leaves);

        // Build proof for leaf 0
        let mut path = vec![];
        let mut indices = vec![];
        let mut current_level: alloc::vec::Vec<U256> = leaves.clone();
        let mut target_index = 0usize;

        while current_level.len() > 1 {
            let sibling_index = if target_index % 2 == 0 {
                target_index + 1
            } else {
                target_index - 1
            };

            if sibling_index < current_level.len() {
                path.push(current_level[sibling_index]);
            } else {
                path.push(current_level[target_index]);
            }
            indices.push(target_index % 2 == 1);

            // Compute next level
            let mut next_level = vec![];
            for chunk in current_level.chunks(2) {
                let left = chunk[0];
                let right = if chunk.len() > 1 { chunk[1] } else { chunk[0] };
                next_level.push(PoseidonHasher::hash_two(left, right));
            }

            target_index /= 2;
            current_level = next_level;
        }

        assert!(MerkleVerifier::verify(root, leaves[0], &path, &indices));
    }
}
