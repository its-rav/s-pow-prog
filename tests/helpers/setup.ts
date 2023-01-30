import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
  web3,
  AnchorProvider,
  Program,
  BN,
  utils,
  SplToken,
} from "@project-serum/anchor";
import { PROPOSAL_SEED } from "./constants";

export function findProposalPda(
  spender: PublicKey,
  recipient: PublicKey,
  identifier: String,
  program
) {
  console.log();
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(PROPOSAL_SEED),
      spender.toBuffer(),
      recipient.toBuffer(),
      Buffer.from(identifier),
    ],
    program.programId
  );
}

export const createProposal = async (
  proposer: Keypair,
  spender: Keypair,
  recipient: Keypair,
  identifier: String,
  title: String,
  token: Keypair,
  amount: BN,
  tags: String[],
  coverCid: String,
  subtitle: String,
  program
) => {
  const [pda] = findProposalPda(
    spender.publicKey,
    recipient.publicKey,
    identifier,
    program
  );

  return [
    pda,
    await program.methods
      .createProposal(
        spender.publicKey,
        recipient.publicKey,
        identifier,
        title,
        token.publicKey,
        amount,
        tags,
        coverCid,
        subtitle
      )
      .accounts({
        proposer: proposer.publicKey,
        proposal: pda,
        systemProgram: SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([proposer])
      .rpc(),
  ];
};

export const initializeMint = async (
  decimals: number,
  token: web3.Keypair,
  splProgram: Program<SplToken>
) => {
  const ix = await (splProgram.account as any).mint.createInstruction(token);

  const tx = new web3.Transaction().add(ix);
  const provider = splProgram.provider as AnchorProvider;
  await provider.sendAndConfirm(tx, [token]);
  return await splProgram.rpc.initializeMint(
    decimals,
    provider.wallet.publicKey,
    provider.wallet.publicKey,
    {
      accounts: {
        mint: token.publicKey,
        rent: web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [],
    }
  );
};

export const initializeAccount = async (
  tokenAccount: web3.PublicKey,
  token: web3.PublicKey,
  authority: web3.PublicKey,
  provider: AnchorProvider
) => {
  const ix = new web3.TransactionInstruction({
    keys: [
      {
        pubkey: provider.wallet.publicKey,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: tokenAccount,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: authority,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: token,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: web3.SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: utils.token.TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: web3.SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
    ],
    programId: utils.token.ASSOCIATED_PROGRAM_ID,
    data: Buffer.from([]),
  });
  const tx = new web3.Transaction().add(ix);
  return await provider.sendAndConfirm(tx);
};

export const mintTo = async (
  amount: BN,
  token: web3.PublicKey,
  tokenAccount: web3.PublicKey,
  splProgram: Program<SplToken>
) => {
  const provider = splProgram.provider as AnchorProvider;
  await splProgram.methods
    .mintTo(amount)
    .accounts({
      mint: token,
      to: tokenAccount,
      authority: provider.wallet.publicKey,
    })
    .rpc();
};
