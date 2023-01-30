use crate::errors::ErrorCodes;
use crate::schemas::proposal::*;
use anchor_lang::prelude::*;

#[event]
pub struct ProposalRejectedEvent {
    pub proposal: Pubkey,
}

#[derive(Accounts)]
pub struct RejectProposal<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut,
        constraint = *signer.key == proposal.spender
        @ ErrorCodes::InvalidAccount
    )]
    pub proposal: Account<'info, Proposal>,

    pub system_program: Program<'info, System>,
}

pub fn exec(ctx: Context<RejectProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;

    // Only allow rejection of proposals that are at approved or default status
    
    if proposal.status != ApprovalStatus::Default && proposal.status != ApprovalStatus::Approved {
        return err!(ErrorCodes::InvalidProposalStatus);
    }

    // Reject the proposal
    proposal.status = ApprovalStatus::Rejected;

    // Emit the event ProposalCancelledEvent
    emit!(ProposalRejectedEvent {
        proposal: proposal.key(),
    });

    Ok(())
}
