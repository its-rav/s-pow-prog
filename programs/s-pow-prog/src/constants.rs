use anchor_lang::prelude::*;

pub const DISCRIMINATOR_SIZE: usize = 8;
pub const PUBKEY_SIZE: usize = std::mem::size_of::<Pubkey>();
pub const U8_SIZE: usize = std::mem::size_of::<u8>();
pub const U32_SIZE: usize = std::mem::size_of::<u32>();
pub const U64_SIZE: usize = std::mem::size_of::<u64>();
pub const U128_SIZE: usize = std::mem::size_of::<u128>();
pub const I64_SIZE: usize = std::mem::size_of::<i64>();
pub const BOOL_SIZE: usize = std::mem::size_of::<bool>();
pub const VECTOR_OVERHEAD_SIZE: usize = 4;
pub const STRING_OVERHEAD_SIZE: usize = 4;
pub const ENUM_OVERHEAD_SIZE: usize = 1;
pub const OPTION_SIZE: usize = 1;

pub const PROPOSAL_SEED: &[u8] = b"proposal";

pub const MAX_COVER_CID_LENGTH: usize = 128;
pub const MAX_SUBTITLE_LENGTH: usize = 256;
pub const MAX_TITLE_LENGTH: usize = 256;
pub const MAX_REASON_LENGTH: usize = 256;
pub const MAX_TAGS: usize = 16;
pub const MAX_TAG_LENGTH: usize = 16;