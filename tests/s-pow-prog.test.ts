import {
  Program,
  AnchorProvider,
  BN,
  workspace,
  web3,
  setProvider,
  Spl,
  utils,
} from "@project-serum/anchor";
import { SPowProg } from "../target/types/s_pow_prog";

import { airdropIfNeeded } from "./helpers/airdropIfNeeded";
import {
  findProposalPda,
  initializeAccount,
  initializeMint,
  mintTo,
} from "./helpers/setup";
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

import * as bs58 from "bs58";
import { expect } from "chai";

describe("[s-pow-prog]", () => {
  // Configure the client to use the local cluster.
  const provider = AnchorProvider.env();
  setProvider(provider);

  const program = workspace.SPowProg as Program<SPowProg>;

  const airdropSolAmount = 2;

  let proposer = web3.Keypair.generate();
  let spender = web3.Keypair.generate();
  let recipient = web3.Keypair.generate();

  const token = new web3.Keypair();
  let spenderTokenAccount: PublicKey;
  const splTokenProgram = Spl.token();

  let proposalPda: PublicKey, proposalPda2nd: PublicKey;
  let title: string, title2nd: string;

  before("prepare", async () => {
    console.log("recipient: ", recipient.publicKey.toBase58());
    await airdropIfNeeded(provider, proposer.publicKey, airdropSolAmount);

    await airdropIfNeeded(provider, spender.publicKey, airdropSolAmount);

    const initializeMintTx = await initializeMint(6, token, splTokenProgram);
    console.log("initializeMint: ", initializeMintTx);

    spenderTokenAccount = await utils.token.associatedAddress({
      mint: token.publicKey,
      owner: spender.publicKey,
    });

    console.log(
      `associatedAddress of mint: ${token.publicKey.toBase58()} and owner ${spender.publicKey.toBase58()} `
    );

    const initializeAccountTx = await initializeAccount(
      spenderTokenAccount,
      token.publicKey,
      spender.publicKey,
      provider
    );

    console.log(`initializeAccount: ${initializeAccountTx}`);

    await mintTo(
      new BN(100 * LAMPORTS_PER_SOL),
      token.publicKey,
      spenderTokenAccount,
      splTokenProgram
    );

    // try {
    //   const data = await splTokenProgram.account.mint.fetch(
    //     spenderTokenAccount
    //   );
    //   console.log(data);
    // } catch (e) {
    //   console.log(e);
    // }

    // await airdropIfNeeded(provider, recipient.publicKey, airdropSolAmount);
  });

  it("[Proposer] create proposal", async () => {
    title = "Summer Coding Camp Winner";
    const amount = new BN(100 * LAMPORTS_PER_SOL);
    const tags = ["xyz"];
    const coverCid = "QmQqzMTavQgT4f4T5v6PWBp7XNKtoPmC9jvn12WPT3gkSE";
    const subtitle = "Summer Coding Camp Winner subtitle";

    [proposalPda] = findProposalPda(
      spender.publicKey,
      recipient.publicKey,
      title,
      program
    );

    console.log("[Proposer] Creating a proposal: ", proposalPda.toBase58());
    const signature = await program.methods
      .createProposal(
        spender.publicKey,
        recipient.publicKey,
        title,
        token.publicKey,
        amount,
        tags,
        coverCid,
        subtitle
      )
      .accounts({
        proposer: proposer.publicKey,
        proposal: proposalPda,
        systemProgram: SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([proposer])
      .rpc();

    console.log("[Proposer] Successfully created a proposal: ", signature);

    //create 2nd proposal
    title2nd = `${title} 2nd`;
    const subtitle2nd = `${subtitle} 2nd`;

    [proposalPda2nd] = findProposalPda(
      spender.publicKey,
      recipient.publicKey,
      title2nd,
      program
    );

    const signature2nd = await program.methods
      .createProposal(
        spender.publicKey,
        recipient.publicKey,
        title2nd,
        token.publicKey,
        amount,
        tags,
        coverCid,
        subtitle2nd
      )
      .accounts({
        proposer: proposer.publicKey,
        proposal: proposalPda,
        systemProgram: SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([proposer])
      .rpc();

    console.log("[Proposer] Successfully created a proposal: ", signature2nd);

    const proposalData = await program.account.proposal.fetch(proposalPda);

    console.log("[Proposer] Created proposal: ", proposalData);

    expect(proposalData.recipient.toBase58()).to.equal(
      recipient.publicKey.toBase58()
    );
    expect(proposalData.spender.toBase58()).to.equal(
      spender.publicKey.toBase58()
    );
    expect(proposalData.title).to.equal(title);
    expect(proposalData.spl.toBase58()).to.equal(token.publicKey.toBase58());
    expect(proposalData.amount.toNumber()).to.equal(amount.toNumber());
    expect(proposalData.tags[0]).to.equal(tags[0]);
    expect(proposalData.coverCid).to.equal(coverCid);
    expect(proposalData.subtitle).to.equal(subtitle);

    const proposalData2nd = await program.account.proposal.fetch(
      proposalPda2nd
    );

    console.log("[Proposer] Created proposal: ", proposalData2nd);

    expect(proposalData2nd.recipient.toBase58()).to.equal(
      recipient.publicKey.toBase58()
    );
    expect(proposalData2nd.spender.toBase58()).to.equal(
      spender.publicKey.toBase58()
    );
    expect(proposalData2nd.title).to.equal(title2nd);
    expect(proposalData2nd.spl.toBase58()).to.equal(token.publicKey.toBase58());
    expect(proposalData2nd.amount.toNumber()).to.equal(amount.toNumber());
    expect(proposalData2nd.tags[0]).to.equal(tags[0]);
    expect(proposalData2nd.coverCid).to.equal(coverCid);
    expect(proposalData2nd.subtitle).to.equal(subtitle2nd);
  });

  it("[Users] get proposals by spender ", async () => {
    const proposals = await program.account.proposal.all([
      {
        memcmp: {
          offset: 8, // Discriminator.
          bytes: spender.publicKey.toBase58(),
        },
      },
      // {
      //   memcmp: {
      //     offset: 40, // Discriminator.
      //     bytes: treasury.publicKey.toBase58(),
      //   },
      // },
      // {
      //   memcmp: {
      //     offset: 72, // Discriminator.
      //     bytes: bs58.encode(Buffer.from(title)),
      //   },
      // },
    ]);

    expect(proposals.length).to.equal(2);
    expect(proposals.map((p) => p.account.title)).to.contains(title2nd);
    expect(proposals.map((p) => p.account.title)).to.contains(title);
  });

  it("[Users] get proposals by recipient ", async () => {
    const proposals = await program.account.proposal.all([
      {
        memcmp: {
          offset: 8 + 32, // Discriminator.
          bytes: recipient.publicKey.toBase58(),
        },
      },
      // {
      //   memcmp: {
      //     offset: 72, // Discriminator.
      //     bytes: bs58.encode(Buffer.from(title)),
      //   },
      // },
    ]);

    expect(proposals.length).to.equal(2);
    expect(proposals.map((p) => p.account.title)).to.contains(title2nd);
    expect(proposals.map((p) => p.account.title)).to.contains(title);
  });

  it("[Users] get proposals by recipient, spender, title ", async () => {
    const proposals = await program.account.proposal.all([
      {
        memcmp: {
          offset: 8, // Discriminator.
          bytes: spender.publicKey.toBase58(),
        },
      },
      {
        memcmp: {
          offset: 8 + 32, // Discriminator.
          bytes: recipient.publicKey.toBase58(),
        },
      },
      {
        memcmp: {
          offset: 8 + 32 + 32 + 4, // Discriminator.
          bytes: bs58.encode(Buffer.from(title2nd)),
        },
      },
    ]);

    expect(proposals.length).to.equal(1);
    expect(proposals.map((p) => p.account.title)).to.contains(title2nd);
  });

  it("[Proposer] cancel proposal", async () => {
    const signature = await program.methods
      .cancelProposal()
      .accounts({
        signer: proposer.publicKey,
        proposer: proposer.publicKey,
        proposal: proposalPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([proposer])
      .rpc();

    console.log("[Proposer] Successfully canceled a proposal: ", signature);
    try {
      await program.account.proposal.fetch(proposalPda);
    } catch (e) {
      expect(e.message).to.contains(`Account does not exist`);
      expect(e.message).to.contains(proposalPda.toBase58());
    }
  });

  it("[Approver] approve proposal", async () => {});

  it("[Approver] reject proposal", async () => {});

  it("[Recipient] accept proposal", async () => {});
});
