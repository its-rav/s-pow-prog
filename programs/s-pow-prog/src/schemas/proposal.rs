use std::mem;

use crate::constants::*;
use anchor_lang::prelude::*;

#[derive(Debug, PartialEq, AnchorDeserialize, AnchorSerialize, Clone)]
pub enum ApprovalStatus {
    Default = 0,
    Rejected = 1,
    Approved = 2,
    Claimed = 3,
}

impl Default for ApprovalStatus {
    fn default() -> Self {
        ApprovalStatus::Default
    }
}

#[account]
#[derive(Default)]
pub struct Proposal {
    pub recipient: Pubkey,
    pub spender: Pubkey,
    pub title: String,
    pub spl: Pubkey,
    pub amount: u64,
    pub proposer: Pubkey,
    pub tags: Vec<String>,
    pub status: ApprovalStatus,
    pub cover_cid: String,
    pub subtitle: String,
    pub reason: Option<String>,
}

impl Proposal {
    // FYI: https://github.com/coral-xyz/anchor/blob/master/lang/syn/src/codegen/program/handlers.rs#L98
    pub fn space() -> usize {
        8 +  // discriminator
        PUBKEY_SIZE + // recipient
        PUBKEY_SIZE + // spender
        STRING_OVERHEAD_SIZE + MAX_TITLE_LENGTH  + // title
        PUBKEY_SIZE + // spl
        U64_SIZE + // amount
        PUBKEY_SIZE + // proposer
        VECTOR_OVERHEAD_SIZE +  MAX_TAG_LENGTH * MAX_TAGS +// tags
        1 + U8_SIZE +// status
        STRING_OVERHEAD_SIZE + MAX_COVER_CID_LENGTH + // cover_cid
        STRING_OVERHEAD_SIZE + MAX_SUBTITLE_LENGTH + // subtitle
        OPTION_SIZE + STRING_OVERHEAD_SIZE + MAX_REASON_LENGTH  // reason
    }
}
