// use crate::errors::ErrorCodes;
// use crate::schemas::proposal::*;
// use anchor_lang::prelude::*;

// #[event]
// pub struct ProposalApprovedEvent {
//     pub proposal: Pubkey,
// }

// #[derive(Accounts)]
// pub struct ApproveProposal<'info> {
//     #[account(mut)]
//     pub approver: Signer<'info>,

//     #[account(mut,constraint = *approver.key == proposal.treasury
//     @ ErrorCodes::InvalidAccount
//     )]
//     pub proposal: Account<'info, Proposal>,

//     #[account(
//         init,
//         payer = authority,
//         associated_token::mint = y_token,
//         associated_token::authority = treasurer
//       )]
//     pub treasury: Box<Account<'info, token::TokenAccount>>,

//     pub system_program: Program<'info, System>,
// }

// pub fn exec(ctx: Context<CancelProposal>) -> Result<()> {
//     let proposal = &mut ctx.accounts.proposal;

//     // Only allow approval of proposals that are not approved 
    
//     if proposal.approval_status != ApprovalStatus::Default {
//         return Err(ErrorCode::InvalidProposalStatus.into());
//     }

//     // Approve spl token transfer
//     let ix = spl_token::instruction::approve(
//         &spl_token::ID,
//         &proposal.treasury,
//         &proposal.spl,
//         &ctx.accounts.approver.key,
//         &[],
//         proposal.amount,
//     )?;

//     // Send the transaction to the network
//     let (recent_blockhash, fee_calculator) = ctx
//         .rpc_client
//         .get_recent_blockhash()
//         .map_err(|_| ErrorCode::RpcClientError)?;
//     let mut tx = Transaction::new_with_payer(
//         &[ix],
//         Some(&ctx.accounts.proposer.key),
//     );
//     let signers = vec![&ctx.accounts.proposer.key];
//     tx.sign(&signers, recent_blockhash);
//     ctx.rpc_client
//         .send_and_confirm_transaction_with_spinner(&tx)
//         .map_err(|_| ErrorCode::RpcClientError)?;


//     // Approve the proposal
//     proposal.approval_status = ApprovalStatus::Approved;

//     // Emit the event ProposalCancelledEvent
//     emit!(ProposalApprovedEvent {
//         proposal: proposal.key(),
//     });

//     Ok(())
// }
