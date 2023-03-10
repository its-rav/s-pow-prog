use crate::errors::ErrorCodes;
use crate::schemas::proposal::*;
use crate::constants::*;
use anchor_lang::prelude::*;
#[event]
pub struct ProposalCreatedEvent {
  pub recipient: Pubkey,
  pub spender: Pubkey,
  pub title: String,
  pub spl: Pubkey,
  pub amount: u64,
  pub proposer: Pubkey,
  pub proposal: Pubkey,
}


#[derive(Accounts)]
#[instruction(
  spender: Pubkey,
  recipient: Pubkey,
  identifier: String,
)]

pub struct CreateProposal<'info> {
  #[account(mut)]
  pub proposer: Signer<'info>,

  #[account(
    init, 
    seeds = [
      PROPOSAL_SEED.as_ref(), 
      spender.as_ref(), 
      recipient.as_ref(), 
      identifier.as_bytes()
      ],
    bump,
    payer = proposer, 
    space = Proposal::space()
    )]
  pub proposal: Account<'info, Proposal>,


  // #[account(seeds = [b"treasurer", &proposal.key().to_bytes()], bump)]
  // /// CHECK: Just a pure account
  // pub treasurer: AccountInfo<'info>,

  // #[account(
  //   init,
  //   payer = proposer,
  //   associated_token::mint = spl,
  //   associated_token::authority = treasurer
  // )]
  // pub treasury: Box<Account<'info, token::TokenAccount>>,

  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

pub fn exec(
    ctx: Context<CreateProposal>, 
    spender: Pubkey,
    recipient: Pubkey,
    identifier: String,
    title: String, 
    spl: Pubkey,
    amount: u64,
    tags: Vec<String>,
    cover_cid: String, 
    subtitle: String
) -> Result<()> {
  let proposal = &mut ctx.accounts.proposal;

  if cover_cid.as_bytes().len() > MAX_COVER_CID_LENGTH {
    return err!(ErrorCodes::MaxCoverCidLenExceeded);
	}
  
	if identifier.as_bytes().len() > MAX_IDENTIFIER_LENGTH {
    return err!(ErrorCodes::MaxIdentifierLenExceeded);
	}

	if title.as_bytes().len() > MAX_TITLE_LENGTH {
    return err!(ErrorCodes::MaxTitleLenExceeded);
	}

	if subtitle.as_bytes().len() > MAX_SUBTITLE_LENGTH {
    return err!(ErrorCodes::MaxSubtitleLenExceeded);
	}

	if tags.iter().any(|tag| tag.as_bytes().len() > MAX_TAG_LENGTH) {
    return err!(ErrorCodes::MaxTagLenExceeded);
	}

	if tags.len() > MAX_TAGS {
    return err!(ErrorCodes::MaxNumberOfTagsExceeded);
	}

  proposal.spender = spender;
  proposal.recipient = recipient;
  proposal.identifier = identifier.clone();
  proposal.title = title.clone();
  proposal.spl = spl;
  proposal.amount = amount;
  proposal.proposer = ctx.accounts.proposer.key();
  proposal.tags = tags.clone();
  proposal.status = ApprovalStatus::Default;
  proposal.cover_cid = cover_cid.clone();
  proposal.subtitle = subtitle.clone();

  emit!(ProposalCreatedEvent {
    recipient: recipient,
    spender: spender,
    title: title.clone(),
    spl: spl,
    amount: amount,
    proposer: ctx.accounts.proposer.key(),
    proposal: ctx.accounts.proposal.key()
  });

  Ok(())
}