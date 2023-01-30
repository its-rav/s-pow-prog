use crate::errors::ErrorCodes;
use crate::schemas::proposal::*;
use anchor_lang::prelude::*;

#[event]
pub struct ProposalApprovedEvent {
    pub proposal: Pubkey,
}

#[derive(Accounts)]
pub struct ApproveProposal<'info> {
    #[account(mut)]
    pub approver: Signer<'info>,

    #[account(mut,
        constraint = *approver.key == proposal.spender
        @ ErrorCodes::InvalidAccount
    )]
    pub proposal: Account<'info, Proposal>,

    pub system_program: Program<'info, System>,
}

pub fn exec(ctx: Context<ApproveProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;

    // Only allow approval of proposals that are not approved 
    
    if proposal.status != ApprovalStatus::Default {
        return err!(ErrorCodes::InvalidProposalStatus);
    }

    // Approve the proposal
    proposal.status = ApprovalStatus::Approved;

    // Emit the event ProposalCancelledEvent
    emit!(ProposalApprovedEvent {
        proposal: proposal.key(),
    });

    Ok(())
}
