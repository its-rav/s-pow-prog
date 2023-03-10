use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCodes {
  #[msg("Maximum Identifier length exceeded")]
  MaxIdentifierLenExceeded,
  #[msg("Maximum title length exceeded")]
  MaxTitleLenExceeded,
  #[msg("Maximum reason length exceeded")]
  MaxReasonLenExceeded,
  #[msg("Maximum cover cid length exceeded")]
  MaxCoverCidLenExceeded,
  #[msg("Maximum subtitle length exceeded")]
  MaxSubtitleLenExceeded,
  #[msg("Maximum tag length exceeded")]
  MaxTagLenExceeded,

  #[msg("Maximum number of tags exceeded")]
  MaxNumberOfTagsExceeded,


  #[msg("Invalid account")]
  InvalidAccount,
  #[msg("Invalid proposal status")]
  InvalidProposalStatus,

  #[msg("Cannot find treasurer account")]
  NoTreasurerBump,
	
}