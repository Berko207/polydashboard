"use client";

import { useEffect, useRef, useState } from "react";

import { fetchBook } from "@/lib/pm/rest";
import { applyPriceChanges, openMarketChannel } from "@/lib/pm/ws";
import type { OrderBookSnapshot, TokenId, WsStatus } from "@/lib/pm/types";

export interface UseOrderBookResult {
  book: OrderBookSnapshot | null;
  status: WsStatus;
  error: string | null;
}

/**
 * Live order book for a single outcome token. Seeds an initial snapshot from the
 * REST `/book` endpoint, then opens the market-channel WebSocket and folds each
 * `price_change` delta onto the latest snapshot. A fresh `book` WS frame (e.g.
 * after a reconnect) fully replaces the snapshot.
 *
 * State is tagged with the token it belongs to and reconciled during render, so
 * switching outcomes never flashes the previous token's book and we avoid
 * synchronous resets inside the effect. Pass `null` to tear everything down.
 */
export function useOrderBook(tokenId: TokenId | null): UseOrderBookResult {
  const [snapshot, setSnapshot] = useState<OrderBookSnapshot | null>(null);
  const [status, setStatus] = useState<WsStatus>("closed");
  const [error, setError] = useState<{ tokenId: TokenId; message: string } | null>(null);

  // Authoritative snapshot held outside React state so delta application never
  // races an async setState batch.
  const snapshotRef = useRef<OrderBookSnapshot | null>(null);

  useEffect(() => {
    snapshotRef.current = null;
    if (!tokenId) return;

    let cancelled = false;
    const commit = (next: OrderBookSnapshot) => {
      snapshotRef.current = next;
      setSnapshot(next);
    };

    // 1) REST snapshot seeds the book immediately.
    fetchBook(tokenId)
      .then((snap) => {
        if (cancelled || snap.tokenId !== tokenId) return;
        commit(snap);
      })
      .catch((err) => {
        if (!cancelled) setError({ tokenId, message: err instanceof Error ? err.message : String(err) });
      });

    // 2) WS provides live snapshots + deltas.
    const channel = openMarketChannel([tokenId], {
      onStatus: (next) => {
        if (!cancelled) setStatus(next);
      },
      onBook: (snap) => {
        if (cancelled || snap.tokenId !== tokenId) return;
        commit(snap);
      },
      onPriceChange: (changedToken, changes) => {
        if (cancelled || changedToken !== tokenId) return;
        const current = snapshotRef.current;
        if (!current) return; // wait for a base snapshot before applying deltas
        commit(applyPriceChanges(current, changes));
      },
    });

    return () => {
      cancelled = true;
      channel.close();
    };
  }, [tokenId]);

  // Reconcile during render: only surface state that belongs to the active token.
  return {
    book: snapshot && snapshot.tokenId === tokenId ? snapshot : null,
    status: tokenId ? status : "closed",
    error: error && error.tokenId === tokenId ? error.message : null,
  };
}
