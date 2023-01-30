use crate::errors::ErrorCodes;
use crate::schemas::proposal::*;
use anchor_lang::prelude::*;

#[event]
pub struct ProposalCancelledEvent {
    pub proposal: Pubkey,
}

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut,
        constraint = *signer.key == proposal.proposer || *signer.key == proposal.spender
        @ ErrorCodes::InvalidAccount
    )]
    pub proposal: Account<'info, Proposal>,

    pub system_program: Program<'info, System>,
}

pub fn exec(ctx: Context<CancelProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;

    // Only allow cancel of proposals that are not approved
    if proposal.status != ApprovalStatus::Approved {
        // Close the proposal account and return the lamports to the proposer
        proposal.close(ctx.accounts.signer.to_account_info())?
    }

    // Emit the event ProposalCancelledEvent
    emit!(ProposalCancelledEvent {
        proposal: proposal.key(),
    });

    Ok(())
}