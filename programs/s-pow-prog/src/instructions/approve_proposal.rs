use crate::errors::ErrorCodes;
use crate::schemas::proposal::*;
use anchor_lang::prelude::*;
use anchor_spl::{associated_token, token};

#[event]
pub struct ProposalApprovedEvent {
    pub proposal: Pubkey,
}

#[derive(Accounts)]
pub struct ApproveProposal<'info> {
    #[account(mut)]
    pub spender: Signer<'info>,
    
    pub spl: Box<Account<'info, token::Mint>>,
    #[account(mut, 
        constraint = spender_token_account.owner == spender.key() && spender_token_account.mint == spl.key()
        @ ErrorCodes::InvalidAccount
    )]
    pub spender_token_account: Account<'info, token::TokenAccount>,

    #[account(mut,
        constraint = spender.key() == proposal.spender && spl.key() == proposal.spl
        @ ErrorCodes::InvalidAccount
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(seeds = [b"treasurer", &proposal.key().to_bytes()], bump)]
    /// CHECK: Just a pure account
    pub treasurer: AccountInfo<'info>,

    #[account(
      init,
      payer = spender,
      associated_token::mint = spl,
      associated_token::authority = treasurer
    )]
    pub proposal_treasury: Box<Account<'info, token::TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn exec(ctx: Context<ApproveProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;

    // Only allow approval of proposals that are not approved 
    
    if proposal.status != ApprovalStatus::Default {
        return err!(ErrorCodes::InvalidProposalStatus);
    }

    // transfer token from the spender to a treasury account
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
          from: ctx.accounts.spender_token_account.to_account_info(),
          to: ctx.accounts.proposal_treasury.to_account_info(),
          authority: ctx.accounts.spender.to_account_info(),
        },
      );
    token::transfer(transfer_ctx, proposal.amount)?;

    // Approve the proposal
    proposal.status = ApprovalStatus::Approved;

    // Emit the event ProposalCancelledEvent
    emit!(ProposalApprovedEvent {
        proposal: proposal.key(),
    });

    Ok(())
}
