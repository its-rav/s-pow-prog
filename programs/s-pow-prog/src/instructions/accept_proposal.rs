use crate::errors::ErrorCodes;
use crate::schemas::proposal::*;
use anchor_lang::prelude::*;
use anchor_spl::{associated_token, token};

#[event]
pub struct ProposalAcceptedEvent {
    pub proposal: Pubkey,
}

#[derive(Accounts)]
pub struct AcceptProposal<'info> {
    #[account(mut)]
    pub recipient: Signer<'info>,

    pub spl: Box<Account<'info, token::Mint>>,
    #[account(mut, 
        constraint = recipient_token_account.owner == recipient.key() && recipient_token_account.mint == spl.key()
        @ ErrorCodes::InvalidAccount
    )]
    pub recipient_token_account: Account<'info, token::TokenAccount>,

    #[account(mut,
        constraint = *recipient.key == proposal.recipient && proposal.spl == spl.key()
        @ ErrorCodes::InvalidAccount
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(mut,
        associated_token::mint = spl,
        associated_token::authority = treasurer
      )]
    pub proposal_treasury: Box<Account<'info, token::TokenAccount>>,

    #[account(seeds = [b"treasurer", &proposal.key().to_bytes()], bump)]
    /// CHECK: Just a pure account
    pub treasurer: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
}

pub fn exec(ctx: Context<AcceptProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;

    // Only allow accept the proposal if it is approved
    if proposal.status != ApprovalStatus::Approved {
        return err!(ErrorCodes::InvalidProposalStatus);
    }

    let seeds: &[&[&[u8]]] = &[&[
        b"treasurer".as_ref(),
        &proposal.key().to_bytes(),
        &[*ctx.bumps.get("treasurer").ok_or(ErrorCodes::NoTreasurerBump)?],
      ]];

    // transfer token from the treasury to a recipient
    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
          from: ctx.accounts.proposal_treasury.to_account_info(),
          to: ctx.accounts.recipient_token_account.to_account_info(),
          authority: ctx.accounts.treasurer.to_account_info(),
        },
        seeds,
      );
    token::transfer(transfer_ctx, proposal.amount)?;

    // Reject the proposal
    proposal.status = ApprovalStatus::Claimed;

    // Emit the event ProposalCancelledEvent
    emit!(ProposalAcceptedEvent {
        proposal: proposal.key(),
    });

    Ok(())
}
