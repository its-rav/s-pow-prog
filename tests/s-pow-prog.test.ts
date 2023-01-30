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

import { airdropIfNeeded, delay } from "./helpers/airdropIfNeeded";
import {
  createProposal,
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

  before("prepare", async () => {
    console.log("recipient: ", recipient.publicKey.toBase58());
    await airdropIfNeeded(provider, proposer.publicKey, airdropSolAmount);

    // await airdropIfNeeded(provider, spender.publicKey, airdropSolAmount);

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
    const identifier = "T1";
    const title = "Summer Coding Camp Winner";
    const amount = new BN(100 * LAMPORTS_PER_SOL);
    const tags = ["xyz"];
    const coverCid = "QmQqzMTavQgT4f4T5v6PWBp7XNKtoPmC9jvn12WPT3gkSE";
    const subtitle = "Summer Coding Camp Winner subtitle";

    const [pda, signature] = await createProposal(
      proposer,
      spender,
      recipient,
      identifier,
      title,
      token,
      amount,
      tags,
      coverCid,
      subtitle,
      program
    );

    const proposalData = await program.account.proposal.fetch(pda);

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
  });

  it("[Users] get proposals by spender ", async () => {
    const identifier = "T2";
    const title = "[Users] get proposals by spender";
    const amount = new BN(100 * LAMPORTS_PER_SOL);
    const tags = ["xyz"];
    const coverCid = "QmQqzMTavQgT4f4T5v6PWBp7XNKtoPmC9jvn12WPT3gkSE";
    const subtitle = "[Users] get proposals by spender subtitle";

    const proposalsBefore = await program.account.proposal.all([
      {
        memcmp: {
          offset: 8 + 32, // Discriminator.
          bytes: spender.publicKey.toBase58(),
        },
      },
    ]);

    const [pda, signature] = await createProposal(
      proposer,
      spender,
      recipient,
      identifier,
      title,
      token,
      amount,
      tags,
      coverCid,
      subtitle,
      program
    );

    const proposalsAfter = await program.account.proposal.all([
      {
        memcmp: {
          offset: 8 + 32, // Discriminator.
          bytes: spender.publicKey.toBase58(),
        },
      },
    ]);

    expect(proposalsAfter.length).to.greaterThan(proposalsBefore.length);
    expect(proposalsAfter.map((p) => p.account.title)).to.contains(title);
  });

  it("[Users] get proposals by recipient ", async () => {
    const identifier = "T3";
    const title = "[Users] get proposals by recipient";
    const amount = new BN(100 * LAMPORTS_PER_SOL);
    const tags = ["xyz"];
    const coverCid = "QmQqzMTavQgT4f4T5v6PWBp7XNKtoPmC9jvn12WPT3gkSE";
    const subtitle = "[Users] get proposals by recipient subtitle";

    const proposalsBefore = await program.account.proposal.all([
      {
        memcmp: {
          offset: 0, // Discriminator.
          bytes: recipient.publicKey.toBase58(),
        },
      },
    ]);

    const [pda, signature] = await createProposal(
      proposer,
      spender,
      recipient,
      identifier,
      title,
      token,
      amount,
      tags,
      coverCid,
      subtitle,
      program
    );

    const proposalsAfter = await program.account.proposal.all([
      {
        memcmp: {
          offset: 8, // Discriminator.
          bytes: recipient.publicKey.toBase58(),
        },
      },
    ]);

    expect(proposalsAfter.length).to.greaterThan(proposalsBefore.length);
    expect(proposalsAfter.map((p) => p.account.title)).to.contains(title);
  });

  it("[Users] get proposals by recipient, spender, title ", async () => {
    const identifier = "T4";
    const title = "[Users] get proposals by recipient, spender, title";
    const amount = new BN(100 * LAMPORTS_PER_SOL);
    const tags = ["xyz"];
    const coverCid = "QmQqzMTavQgT4f4T5v6PWBp7XNKtoPmC9jvn12WPT3gkSE";
    const subtitle =
      "[Users] get proposals by recipient, spender, title subtitle";

    const proposalsBefore = await program.account.proposal.all([
      {
        memcmp: {
          offset: 8, // Discriminator.
          bytes: recipient.publicKey.toBase58(),
        },
      },
      {
        memcmp: {
          offset: 8 + 32, // Discriminator.
          bytes: spender.publicKey.toBase58(),
        },
      },
      {
        memcmp: {
          offset: 8 + 32 + 32 + 4, // Discriminator.
          bytes: bs58.encode(Buffer.from(identifier)),
        },
      },
    ]);

    const [pda, signature] = await createProposal(
      proposer,
      spender,
      recipient,
      identifier,
      title,
      token,
      amount,
      tags,
      coverCid,
      subtitle,
      program
    );

    const proposalsAfter = await program.account.proposal.all([
      {
        memcmp: {
          offset: 8, // Discriminator.
          bytes: recipient.publicKey.toBase58(),
        },
      },
      {
        memcmp: {
          offset: 8 + 32, // Discriminator.
          bytes: spender.publicKey.toBase58(),
        },
      },
      {
        memcmp: {
          offset: 8 + 32 + 32 + 4, // Discriminator.
          bytes: bs58.encode(Buffer.from(identifier)),
        },
      },
    ]);

    expect(proposalsAfter.length).to.greaterThan(proposalsBefore.length);
    expect(proposalsAfter.map((p) => p.account.title)).to.contains(title);
  });

  it("[Proposer] cancel proposal", async () => {
    const identifier = "T5";
    const title = "[Proposer] cancel proposal";
    const amount = new BN(100 * LAMPORTS_PER_SOL);
    const tags = ["xyz"];
    const coverCid = "QmQqzMTavQgT4f4T5v6PWBp7XNKtoPmC9jvn12WPT3gkSE";
    const subtitle = "[Proposer] cancel proposal subtitle";

    const balanceBefore = await program.provider.connection.getBalance(
      proposer.publicKey
    );

    const [pda, signature] = await createProposal(
      proposer,
      spender,
      recipient,
      identifier,
      title,
      token,
      amount,
      tags,
      coverCid,
      subtitle,
      program
    );

    const data = await program.account.proposal.fetch(pda);
    expect(data.identifier).to.equal(identifier);
    const balanceOnProposalCreated =
      await program.provider.connection.getBalance(proposer.publicKey);

    await program.methods
      .cancelProposal()
      .accounts({
        proposal: pda,
        signer: proposer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([proposer])
      .rpc();

    const balanceAfter = await program.provider.connection.getBalance(
      proposer.publicKey
    );

    expect(balanceBefore).to.greaterThan(balanceOnProposalCreated);
    expect(balanceOnProposalCreated).to.lessThan(balanceAfter);
    expect(balanceBefore).to.equal(balanceAfter);
    try {
      await program.account.proposal.fetch(pda);
    } catch (e) {
      expect(e.message).to.contains(`Account does not exist`);
      expect(e.message).to.contains(pda.toBase58());
    }
  });

  it("[Approver] approve proposal", async () => {
    const identifier = "T6";
    const title = "[Approver] approve proposal";
    const amount = new BN(100 * LAMPORTS_PER_SOL);
    const tags = ["xyz"];
    const coverCid = "QmQqzMTavQgT4f4T5v6PWBp7XNKtoPmC9jvn12WPT3gkSE";
    const subtitle = "[Approver] approve proposal";

    const [pda, signature] = await createProposal(
      proposer,
      spender,
      recipient,
      identifier,
      title,
      token,
      amount,
      tags,
      coverCid,
      subtitle,
      program
    );

    const data = await program.account.proposal.fetch(pda);
    expect(data.status).to.deep.equal({ default: {} });
    expect(data.title).to.equal(title);

    await program.methods
      .approveProposal()
      .accounts({
        approver: spender.publicKey,
        proposal: pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([spender])
      .rpc();

    const dataAfter = await program.account.proposal.fetch(pda);
    expect(dataAfter.status).to.deep.equal({ approved: {} });
    expect(dataAfter.title).to.equal(title);
  });

  it("[Approver] reject proposal", async () => {
    const identifier = "T7";
    const title = "[Approver] reject proposal";
    const amount = new BN(100 * LAMPORTS_PER_SOL);
    const tags = ["xyz"];
    const coverCid = "QmQqzMTavQgT4f4T5v6PWBp7XNKtoPmC9jvn12WPT3gkSE";
    const subtitle = "[Approver] reject proposal";

    const [pda, signature] = await createProposal(
      proposer,
      spender,
      recipient,
      identifier,
      title,
      token,
      amount,
      tags,
      coverCid,
      subtitle,
      program
    );

    const data = await program.account.proposal.fetch(pda);
    expect(data.status).to.deep.equal({ default: {} });
    expect(data.title).to.equal(title);

    await program.methods
      .rejectProposal()
      .accounts({
        signer: spender.publicKey,
        proposal: pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([spender])
      .rpc();
    const dataAfter = await program.account.proposal.fetch(pda);
    expect(dataAfter.status).to.deep.equal({ rejected: {} });
    expect(dataAfter.title).to.equal(title);
  });

  it("[Recipient] accept proposal", async () => {
    const identifier = "T8";
    const title = "[Recipient] accept proposal";
    const amount = new BN(100 * LAMPORTS_PER_SOL);
    const tags = ["xyz"];
    const coverCid = "QmQqzMTavQgT4f4T5v6PWBp7XNKtoPmC9jvn12WPT3gkSE";
    const subtitle = "[Recipient] accept proposal";

    const [pda, signature] = await createProposal(
      proposer,
      spender,
      recipient,
      identifier,
      title,
      token,
      amount,
      tags,
      coverCid,
      subtitle,
      program
    );

    const dataAfterCreated = await program.account.proposal.fetch(pda);
    expect(dataAfterCreated.status).to.deep.equal({ default: {} });
    expect(dataAfterCreated.title).to.equal(title);
    
    await program.methods
      .approveProposal()
      .accounts({
        approver: spender.publicKey,
        proposal: pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([spender])
      .rpc();
      
    const dataAfterApproved = await program.account.proposal.fetch(pda);
    expect(dataAfterApproved.status).to.deep.equal({ approved: {} });
    expect(dataAfterApproved.title).to.equal(title);

    await program.methods
      .acceptProposal()
      .accounts({
        signer: recipient.publicKey,
        proposal: pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([recipient])
      .rpc();

    const dataAfterAccepted = await program.account.proposal.fetch(pda);
    expect(dataAfterAccepted.status).to.deep.equal({ claimed: {} });
    expect(dataAfterAccepted.title).to.equal(title);

  });
});
