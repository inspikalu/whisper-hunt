import { useMemo } from 'react';
import { Connection } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

export function useAnchorProvider() {
  const { connection } = useConnection();
  const wallet = useWallet();

  return useMemo(() => {
    return new AnchorProvider(connection, wallet as any, {
      preflightCommitment: 'confirmed',
    });
  }, [connection, wallet]);
}
