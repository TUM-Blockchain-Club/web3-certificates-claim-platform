"use client";

import { Save } from "lucide-react";
import { useActionState, useState } from "react";
import {
  saveNftPreference,
  type NftPreferenceState,
} from "@/app/actions";
import type { NftPreference } from "@/lib/recipients";

const initialState: NftPreferenceState = {
  status: "idle",
  message: "",
};

type Props = {
  token: string;
  existingPreference: NftPreference | null;
};

export function NftPreferenceForm({ token, existingPreference }: Props) {
  const [state, formAction, isPending] = useActionState(
    saveNftPreference,
    initialState,
  );
  const [destinationType, setDestinationType] = useState(
    existingPreference?.destinationType ?? "none",
  );

  return (
    <form action={formAction} className="stack">
      <input name="token" type="hidden" value={token} />
      <fieldset className="radio-grid">
        <legend>TBC NFT</legend>
        <label className="radio-option">
          <input
            checked={destinationType === "evm_wallet"}
            name="destinationType"
            onChange={() => setDestinationType("evm_wallet")}
            type="radio"
            value="evm_wallet"
          />
          <span>
            <span className="radio-title">My EVM wallet</span>
            <span className="radio-copy">Store an Ethereum-style address.</span>
          </span>
        </label>
        {destinationType === "evm_wallet" ? (
          <div className="field">
            <label htmlFor="evmAddress">Wallet Address</label>
            <input
              defaultValue={existingPreference?.evmAddress ?? ""}
              id="evmAddress"
              name="evmAddress"
              pattern="^0x[0-9A-Fa-f]{40}$"
              placeholder="0x..."
            />
          </div>
        ) : null}
        <label className="radio-option">
          <input
            checked={destinationType === "tbc_wallet"}
            name="destinationType"
            onChange={() => setDestinationType("tbc_wallet")}
            type="radio"
            value="tbc_wallet"
          />
          <span>
            <span className="radio-title">Tum Blockchain Club wallet</span>
            <span className="radio-copy">Record club custody for the NFT.</span>
          </span>
        </label>
        <label className="radio-option">
          <input
            checked={destinationType === "none"}
            name="destinationType"
            onChange={() => setDestinationType("none")}
            type="radio"
            value="none"
          />
          <span>
            <span className="radio-title">No NFT</span>
            <span className="radio-copy">Keep only the PDF certificate.</span>
          </span>
        </label>
      </fieldset>
      <button className="button" disabled={isPending} type="submit">
        <Save aria-hidden="true" size={18} />
        {isPending ? "Saving" : "Save Preference"}
      </button>
      {state.message ? (
        <p
          className={`notice ${state.status === "error" ? "error" : "success"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

