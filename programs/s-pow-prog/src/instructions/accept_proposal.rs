use crate::errors::ErrorCodes;
use crate::schemas::proposal::*;
use anchor_lang::prelude::*;

#[event]
pub struct ProposalAcceptedEvent {
    pub proposal: Pubkey,
}

#[derive(Accounts)]
pub struct AcceptProposal<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut,
        constraint = *signer.key == proposal.recipient
        @ ErrorCodes::InvalidAccount
    )]
    pub proposal: Account<'info, Proposal>,

    pub system_program: Program<'info, System>,
}

pub fn exec(ctx: Context<AcceptProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;

    // Only allow accept the proposal if it is approved
    if proposal.status != ApprovalStatus::Approved {
        return err!(ErrorCodes::InvalidProposalStatus);
    }


    // Reject the proposal
    proposal.status = ApprovalStatus::Claimed;

    // Emit the event ProposalCancelledEvent
    emit!(ProposalAcceptedEvent {
        proposal: proposal.key(),
    });

    Ok(())
}
