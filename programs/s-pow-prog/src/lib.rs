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
        title: String,
        spl: Pubkey,
        amount: u64,
        tags: Vec<String>,
        cover_cid: String,
        subtitle: String,
    ) -> Result<()> {
        create_proposal::exec(
            ctx, spender, recipient, title, spl, amount, tags, cover_cid, subtitle
        );

        Ok(())
    }

    pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
        cancel_proposal::exec(ctx);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
