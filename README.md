# WhisperHunt: The Silent Intelligence Protocol

I built WhisperHunt to bridge the gap between high-stakes whistleblowing and on-chain accountability. In a world where transparency often compromises the source, I wanted to create a platform where intelligence could be shared with total privacy while still ensuring that hunters get paid for their risks.

## The Story

When I started building the core protocol, I realized that requiring a whistleblower to own SOL just to submit a tip was a major privacy leak. It created a link between their personal wallet and the disclosure. So, I pivoted and implemented the **Zero-Gas Gateway**. Now, you can submit an encrypted tip using an ephemeral session key—no SOL required, no history left behind.

While I was refining the **Private Ephemeral Rollup (PER)**, I focused on the "TEE Attestation" layer. I didn't just want the data to be encrypted; I wanted it to be mathematically impossible for anyone but the authorized mission owner to read it. I integrated a Trusted Execution Environment that only lifts the privacy veil once the owner's identity is verified on-chain.

Finally, I tackled the settlement logic. I made sure that the payout from our **L1 Vaults** can only be triggered via a secure Cross-Program Invocation from the PER after the owner approves a submission. This ensures that the hunter's reward is guaranteed, even if the handler moves to a different enclaved node.

## Technical Architecture

- **L1 Programs**: Handle on-chain SOL funding and secure vaults. This is the financial foundation of the protocol.
- **PER Program**: Serves as the "Private Enclave." This handles all encrypted submissions and processing away from the main Solana chain.
- **Frontend Dashboard**: A high-performance, dark-mode specialized interface for handlers to manage intelligence streams.

## Core Features

- **Zero-Gas Gateway**: Submissions use ephemeral session keys, allowing whistleblowers without SOL to disclose anonymously.
- **TEE Attestation**: Trusted Execution Environment ensures that data is only decrypted for the authorized mission owner.
- **Atomic Settlement**: Cross-program invocation ensures that payouts are trustless and triggered only upon manual approval.

## Getting Started

1.  **L1 Program**: Deploy to Solana Devnet (`RSKi...`).
2.  **PER Program**: Deploy to MagicBlock ephemeral rollup (`Ek8T...`).
3.  **Frontend**: Run `npm run dev` to launch the Intelligence Hub.

### Architecture At a Glance
- `/whisper-hunt-l1`: The Solana On-chain Vaults.
- `/whisper-hunt-per`: The Private Ephemeral Rollups & TEE Logic.
- `/whisper-hunt-frontend`: The high-performance Dashboard & Hub.


