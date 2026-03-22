import { useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { useAnchorProvider } from './useAnchorProvider';
import l1Idl from './idl/whisper_hunt_l1.json';
import perIdl from './idl/whisper_hunt_per.json';

declare const Buffer: any;

import { WhisperHuntL1 } from './idl/whisper_hunt_l1';
import { WhisperHuntPer } from './idl/whisper_hunt_per';

// Program IDs from Anchor.toml
export const L1_PROGRAM_ID = new PublicKey('RSKiBZg1sMV2qUF3tj4gsYYWVm74sKcTAYvLK7F8Msw');
export const PER_PROGRAM_ID = new PublicKey('Ek8THkUVr8oVsQkXcsWtSCaA9Eg9WAyjG44t4CumLhJg');

export function useWhisperHuntL1() {
  const provider = useAnchorProvider();
  return useMemo(() => new Program(l1Idl as any, provider), [provider]);
}

export function useWhisperHuntPER() {
  const provider = useAnchorProvider();
  return useMemo(() => new Program(perIdl as any, provider), [provider]);
}

export function getBountyBoxPDA(funder: PublicKey, nonce: number[]) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('bounty_box'), funder.toBuffer(), Buffer.from(nonce)],
    L1_PROGRAM_ID
  );
}

export function getVaultPDA(bountyBox: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), bountyBox.toBuffer()],
    L1_PROGRAM_ID
  );
}

export function getBoxPermissionsPDA(boxId: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('box_permissions'), boxId.toBuffer()],
    PER_PROGRAM_ID
  );
}

import { BN } from "@coral-xyz/anchor";

export function getSubmissionPDA(boxId: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('submission'), 
      boxId.toBuffer(),
    ],
    PER_PROGRAM_ID
  );
}

export function getPerAuthorityPDA() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('per_authority')],
    PER_PROGRAM_ID
  );
}
