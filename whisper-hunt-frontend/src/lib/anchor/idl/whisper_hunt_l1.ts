/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/whisper_hunt_l1.json`.
 */
export type WhisperHuntL1 = {
  "address": "RSKiBZg1sMV2qUF3tj4gsYYWVm74sKcTAYvLK7F8Msw",
  "metadata": {
    "name": "whisperHuntL1",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "closeBox",
      "docs": [
        "Original funder reclaims SOL if the deadline passes without any approval."
      ],
      "discriminator": [
        255,
        201,
        78,
        228,
        223,
        71,
        133,
        90
      ],
      "accounts": [
        {
          "name": "funder",
          "writable": true,
          "signer": true
        },
        {
          "name": "bountyBox",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "bountyBox"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createBox",
      "docs": [
        "Creates a new bounty box.",
        "The funder sets a topic, deadline, and a verifier pubkey.",
        "An initial SOL deposit is locked into the vault PDA."
      ],
      "discriminator": [
        108,
        200,
        91,
        3,
        44,
        99,
        31,
        27
      ],
      "accounts": [
        {
          "name": "funder",
          "writable": true,
          "signer": true
        },
        {
          "name": "bountyBox",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  111,
                  117,
                  110,
                  116,
                  121,
                  95,
                  98,
                  111,
                  120
                ]
              },
              {
                "kind": "account",
                "path": "funder"
              },
              {
                "kind": "arg",
                "path": "nonce"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "bountyBox"
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
          "name": "nonce",
          "type": {
            "array": [
              "u8",
              4
            ]
          }
        },
        {
          "name": "topic",
          "type": "string"
        },
        {
          "name": "deadline",
          "type": "i64"
        },
        {
          "name": "verifierPubkey",
          "type": "pubkey"
        },
        {
          "name": "initialAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "fundBox",
      "docs": [
        "Anyone can add more SOL to an existing box — making it a crowd-funded pool."
      ],
      "discriminator": [
        243,
        29,
        4,
        139,
        40,
        103,
        42,
        81
      ],
      "accounts": [
        {
          "name": "funder",
          "writable": true,
          "signer": true
        },
        {
          "name": "bountyBox",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "bountyBox"
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
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "releaseBounty",
      "docs": [
        "Releases the bounty to the winner.",
        "CRITICAL: This instruction must only be called via CPI from the PER program.",
        "The constraint enforces the per_program is the correct program — nobody else can trigger a payout."
      ],
      "discriminator": [
        208,
        104,
        178,
        53,
        137,
        16,
        74,
        64
      ],
      "accounts": [
        {
          "name": "perAuthority",
          "docs": [
            "This is the security nucleus: nobody except a CPI from",
            "the whisper-hunt-per program (via its PDA) can release funds."
          ],
          "signer": true
        },
        {
          "name": "bountyBox",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "bountyBox"
              }
            ]
          }
        },
        {
          "name": "submitter",
          "docs": [
            "by the `submitter` argument passed from the PER program's CPI"
          ],
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "submitter",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "bountyBox",
      "discriminator": [
        100,
        20,
        182,
        201,
        161,
        112,
        226,
        74
      ]
    }
  ],
  "events": [
    {
      "name": "bountyReleased",
      "discriminator": [
        56,
        153,
        231,
        87,
        185,
        70,
        138,
        108
      ]
    },
    {
      "name": "boxClosed",
      "discriminator": [
        4,
        35,
        24,
        59,
        23,
        131,
        136,
        5
      ]
    },
    {
      "name": "boxCreated",
      "discriminator": [
        109,
        164,
        8,
        99,
        246,
        103,
        141,
        0
      ]
    },
    {
      "name": "boxFunded",
      "discriminator": [
        241,
        231,
        144,
        240,
        146,
        197,
        19,
        78
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "topicTooLong",
      "msg": "Topic must be between 1 and 200 characters"
    },
    {
      "code": 6001,
      "name": "zeroFunding",
      "msg": "Funding amount must be greater than zero"
    },
    {
      "code": 6002,
      "name": "deadlineInPast",
      "msg": "Deadline must be in the future"
    },
    {
      "code": 6003,
      "name": "deadlinePassed",
      "msg": "Deadline has already passed"
    },
    {
      "code": 6004,
      "name": "deadlineNotPassed",
      "msg": "Deadline has not yet passed"
    },
    {
      "code": 6005,
      "name": "alreadySettled",
      "msg": "This box has already been settled"
    },
    {
      "code": 6006,
      "name": "emptyVault",
      "msg": "Vault is empty"
    },
    {
      "code": 6007,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6008,
      "name": "unauthorized",
      "msg": "Only the designated authority can perform this action"
    },
    {
      "code": 6009,
      "name": "invalidSubmitter",
      "msg": "Invalid submitter pubkey"
    }
  ],
  "types": [
    {
      "name": "bountyBox",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "boxId",
            "type": "pubkey"
          },
          {
            "name": "funder",
            "type": "pubkey"
          },
          {
            "name": "topic",
            "type": "string"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "verifierPubkey",
            "type": "pubkey"
          },
          {
            "name": "totalFunded",
            "type": "u64"
          },
          {
            "name": "isSettled",
            "type": "bool"
          },
          {
            "name": "winner",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "vaultBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "bountyReleased",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "boxId",
            "type": "pubkey"
          },
          {
            "name": "submitter",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "boxClosed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "boxId",
            "type": "pubkey"
          },
          {
            "name": "funder",
            "type": "pubkey"
          },
          {
            "name": "refundAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "boxCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "boxId",
            "type": "pubkey"
          },
          {
            "name": "funder",
            "type": "pubkey"
          },
          {
            "name": "topic",
            "type": "string"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "verifierPubkey",
            "type": "pubkey"
          },
          {
            "name": "initialAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "boxFunded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "boxId",
            "type": "pubkey"
          },
          {
            "name": "funder",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "newTotal",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
