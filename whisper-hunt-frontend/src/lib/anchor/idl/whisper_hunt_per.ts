/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/whisper_hunt_per.json`.
 */
export type WhisperHuntPer = {
  "address": "Ek8THkUVr8oVsQkXcsWtSCaA9Eg9WAyjG44t4CumLhJg",
  "metadata": {
    "name": "whisperHuntPer",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "approveSubmission",
      "docs": [
        "Owner-only: approve a submission inside the TEE.",
        "",
        "Authentication happens via auth token (challenge/response, issued by the",
        "TEE's permission program). The TEE validates the token before this IX runs.",
        "",
        "On approval:",
        "1. Marks the submission + box as settled (no further changes possible)",
        "2. CPIs into whisper-hunt-l1's `release_bounty` so the vault sends",
        "all SOL to the winning submitter's pubkey."
      ],
      "discriminator": [
        154,
        76,
        116,
        120,
        143,
        128,
        16,
        205
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "boxPermissions",
          "writable": true
        },
        {
          "name": "submission",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  109,
                  105,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "box_permissions.box_id",
                "account": "boxPermissions"
              }
            ]
          }
        },
        {
          "name": "perAuthority",
          "docs": [
            "The PER program's own authority PDA — used to sign the CPI to L1.",
            "L1's `release_bounty` validates this exact PDA as the only allowed caller."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  101,
                  114,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "l1BountyBox",
          "writable": true
        },
        {
          "name": "l1Vault",
          "writable": true
        },
        {
          "name": "submitterWallet",
          "writable": true
        },
        {
          "name": "l1Program"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "submissionId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createBoxPermissions",
      "docs": [
        "Creates permission groups for a given box.",
        "Registers the box_owner (who can read & approve) and",
        "an optional verifier (who can confirm tip authenticity).",
        "",
        "This is called AFTER the box is created on L1.",
        "`box_id` corresponds to the BountyBox account pubkey on L1."
      ],
      "discriminator": [
        204,
        48,
        82,
        126,
        110,
        71,
        187,
        21
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "boxPermissions",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  120,
                  95,
                  112,
                  101,
                  114,
                  109,
                  105,
                  115,
                  115,
                  105,
                  111,
                  110,
                  115
                ]
              },
              {
                "kind": "arg",
                "path": "boxId"
              }
            ]
          }
        },
        {
          "name": "submission",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  109,
                  105,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "boxId"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "boxId",
          "type": "pubkey"
        },
        {
          "name": "verifierPubkey",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "delegateBoxPermissions",
      "docs": [
        "Delegates BOTH the BoxPermissions and Submission accounts to the MagicBlock ER"
      ],
      "discriminator": [
        160,
        185,
        144,
        247,
        159,
        22,
        26,
        123
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "boxPermissions",
          "writable": true
        },
        {
          "name": "bpBuffer",
          "writable": true
        },
        {
          "name": "bpDelegationRecord",
          "writable": true
        },
        {
          "name": "bpDelegationMetadata",
          "writable": true
        },
        {
          "name": "submission",
          "writable": true
        },
        {
          "name": "subBuffer",
          "writable": true
        },
        {
          "name": "subDelegationRecord",
          "writable": true
        },
        {
          "name": "subDelegationMetadata",
          "writable": true
        },
        {
          "name": "delegationProgram",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          "name": "ownerProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "boxId",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "processUndelegation",
      "discriminator": [
        196,
        28,
        41,
        206,
        48,
        37,
        51,
        167
      ],
      "accounts": [
        {
          "name": "baseAccount",
          "writable": true
        },
        {
          "name": "buffer"
        },
        {
          "name": "payer",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "accountSeeds",
          "type": {
            "vec": "bytes"
          }
        }
      ]
    },
    {
      "name": "submitTip",
      "docs": [
        "Stores a privately encrypted tip blob.",
        "",
        "`encrypted_blob` — the raw tip content encrypted CLIENT-SIDE with the",
        "box owner's public key. Even inside the TEE, only the owner holding",
        "the corresponding private key can decrypt it. Double-layer privacy.",
        "",
        "The submitter signs with a session keypair, so their persistent wallet",
        "never appears on any public chain state."
      ],
      "discriminator": [
        223,
        59,
        46,
        101,
        161,
        189,
        154,
        37
      ],
      "accounts": [
        {
          "name": "submitter",
          "signer": true
        },
        {
          "name": "boxPermissions",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  120,
                  95,
                  112,
                  101,
                  114,
                  109,
                  105,
                  115,
                  115,
                  105,
                  111,
                  110,
                  115
                ]
              },
              {
                "kind": "arg",
                "path": "boxId"
              }
            ]
          }
        },
        {
          "name": "submission",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  109,
                  105,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "boxId"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "boxId",
          "type": "pubkey"
        },
        {
          "name": "encryptedBlob",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "undelegateState",
      "docs": [
        "Undelegates BOTH the BoxPermissions and Submission accounts back to the L1 base layer"
      ],
      "discriminator": [
        255,
        189,
        95,
        106,
        242,
        8,
        94,
        171
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "boxPermissions",
          "writable": true
        },
        {
          "name": "submission",
          "writable": true
        },
        {
          "name": "magicContext",
          "writable": true
        },
        {
          "name": "magicProgram"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "boxPermissions",
      "discriminator": [
        128,
        166,
        89,
        214,
        168,
        54,
        104,
        103
      ]
    },
    {
      "name": "submission",
      "discriminator": [
        58,
        194,
        159,
        158,
        75,
        102,
        178,
        197
      ]
    }
  ],
  "events": [
    {
      "name": "permissionsCreated",
      "discriminator": [
        10,
        203,
        102,
        54,
        25,
        43,
        198,
        147
      ]
    },
    {
      "name": "submissionApproved",
      "discriminator": [
        59,
        102,
        182,
        29,
        243,
        202,
        148,
        164
      ]
    },
    {
      "name": "tipSubmitted",
      "discriminator": [
        170,
        224,
        16,
        239,
        244,
        252,
        196,
        12
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "blobTooLarge",
      "msg": "Encrypted blob exceeds maximum allowed size (4096 bytes)"
    },
    {
      "code": 6001,
      "name": "boxAlreadySettled",
      "msg": "This box has already been settled"
    },
    {
      "code": 6002,
      "name": "tooManySubmissions",
      "msg": "Submission limit reached for this box"
    },
    {
      "code": 6003,
      "name": "unauthorized",
      "msg": "Only the box owner can perform this action"
    },
    {
      "code": 6004,
      "name": "alreadyApproved",
      "msg": "This submission has already been approved"
    }
  ],
  "types": [
    {
      "name": "boxPermissions",
      "docs": [
        "Permission group for one bounty box.",
        "Lives entirely inside the TEE — private from Solana L1."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "boxId",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "verifier",
            "type": "pubkey"
          },
          {
            "name": "submissionCount",
            "type": "u64"
          },
          {
            "name": "isSettled",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "permissionsCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "boxId",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "verifier",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "submission",
      "docs": [
        "A single private tip submission.",
        "`encrypted_blob` is client-side encrypted — only the box owner can decrypt."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "boxId",
            "type": "pubkey"
          },
          {
            "name": "submissionId",
            "type": "u64"
          },
          {
            "name": "submitter",
            "type": "pubkey"
          },
          {
            "name": "encryptedBlob",
            "type": "bytes"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "isApproved",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "submissionApproved",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "boxId",
            "type": "pubkey"
          },
          {
            "name": "submissionId",
            "type": "u64"
          },
          {
            "name": "submitter",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "tipSubmitted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "boxId",
            "type": "pubkey"
          },
          {
            "name": "submissionId",
            "type": "u64"
          },
          {
            "name": "submitter",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
