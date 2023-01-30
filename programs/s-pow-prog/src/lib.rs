use anchor_lang::prelude::*;

pub mod constants;

pub mod instructions;
pub use instructions::*;

pub mod schemas;
pub use schemas::*;

pub mod errors;
pub use errors::*;

declare_id!("BHPKDZzNmf7gaLuSFJKcsSiAqhsCWPRHs98ao9TM673V");

#[program]
pub mod s_pow_prog {

    use super::*;

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        spender: Pubkey,
        recipient: Pubkey,
        identifier: String,
        title: String,
        spl: Pubkey,
        amount: u64,
        tags: Vec<String>,
        cover_cid: String,
        subtitle: String,
    ) -> Result<()> {
        return create_proposal::exec(
            ctx, spender, recipient, identifier, title, spl, amount, tags, cover_cid, subtitle,
        );
    }

    pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
        return cancel_proposal::exec(ctx);
    }

    pub fn approve_proposal(ctx: Context<ApproveProposal>) -> Result<()> {
        return approve_proposal::exec(ctx);
    }

    pub fn reject_proposal(ctx: Context<RejectProposal>) -> Result<()> {
        return reject_proposal::exec(ctx);
    }

    pub fn accept_proposal(ctx: Context<AcceptProposal>) -> Result<()> {
        return accept_proposal::exec(ctx);
    }
}
