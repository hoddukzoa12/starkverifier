//! BN254 (alt_bn128) Field Arithmetic
//!
//! Implements modular arithmetic operations for the BN254 prime field.
//! Prime: p = 21888242871839275222246405745257275088548364400416034343698204186575808495617

use alloy_primitives::U256;

/// BN254 field prime
/// p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
pub const BN254_PRIME: U256 = U256::from_limbs([
    0x43e1f593f0000001,
    0x2833e84879b97091,
    0xb85045b68181585d,
    0x30644e72e131a029,
]);

/// BN254 field arithmetic operations
pub struct BN254Field;

impl BN254Field {
    /// Modular addition: (a + b) mod p
    #[inline(always)]
    pub fn add(a: U256, b: U256) -> U256 {
        let (sum, overflow) = a.overflowing_add(b);
        if overflow || sum >= BN254_PRIME {
            sum.wrapping_sub(BN254_PRIME)
        } else {
            sum
        }
    }

    /// Modular subtraction: (a - b) mod p
    #[inline(always)]
    pub fn sub(a: U256, b: U256) -> U256 {
        if a >= b {
            a.wrapping_sub(b)
        } else {
            BN254_PRIME.wrapping_sub(b.wrapping_sub(a))
        }
    }

    /// Modular multiplication: (a * b) mod p
    /// Uses mulmod for efficient modular multiplication
    #[inline(always)]
    pub fn mul(a: U256, b: U256) -> U256 {
        a.mul_mod(b, BN254_PRIME)
    }

    /// Check if value is in field (less than prime)
    #[inline(always)]
    pub fn is_valid(a: U256) -> bool {
        a < BN254_PRIME
    }

    /// Reduce value to field if necessary
    #[inline(always)]
    pub fn reduce(a: U256) -> U256 {
        if a >= BN254_PRIME {
            a.wrapping_sub(BN254_PRIME)
        } else {
            a
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add_no_overflow() {
        let a = U256::from(100u64);
        let b = U256::from(200u64);
        let result = BN254Field::add(a, b);
        assert_eq!(result, U256::from(300u64));
    }

    #[test]
    fn test_add_with_reduction() {
        let a = BN254_PRIME - U256::from(1u64);
        let b = U256::from(2u64);
        let result = BN254Field::add(a, b);
        assert_eq!(result, U256::from(1u64));
    }

    #[test]
    fn test_sub() {
        let a = U256::from(200u64);
        let b = U256::from(100u64);
        let result = BN254Field::sub(a, b);
        assert_eq!(result, U256::from(100u64));
    }

    #[test]
    fn test_sub_underflow() {
        let a = U256::from(100u64);
        let b = U256::from(200u64);
        let result = BN254Field::sub(a, b);
        // Should wrap around: p - 100
        let expected = BN254_PRIME - U256::from(100u64);
        assert_eq!(result, expected);
    }

    #[test]
    fn test_mul() {
        let a = U256::from(7u64);
        let b = U256::from(8u64);
        let result = BN254Field::mul(a, b);
        assert_eq!(result, U256::from(56u64));
    }

    #[test]
    fn test_mul_large() {
        // Test that multiplication properly reduces mod p
        let a = BN254_PRIME - U256::from(1u64);
        let b = U256::from(2u64);
        let result = BN254Field::mul(a, b);
        // (p-1) * 2 = 2p - 2 ≡ -2 ≡ p - 2 (mod p)
        let expected = BN254_PRIME - U256::from(2u64);
        assert_eq!(result, expected);
    }
}
