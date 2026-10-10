"use client";

// Header wishlist/cart counts listen for this; fire it after any change.
export const COUNTS_EVENT = "zesprit:counts";
export const notifyCounts = () => window.dispatchEvent(new Event(COUNTS_EVENT));
