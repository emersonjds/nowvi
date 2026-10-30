"use client";

import { createContext, type ReactNode, useContext } from "react";

import type { ClientDictionary } from "./dictionaries/pt-br";

const DictionaryContext = createContext<ClientDictionary | null>(null);

export const DictionaryProvider = ({ value, children }: { value: ClientDictionary; children: ReactNode }) => (
  <DictionaryContext value={value}>{children}</DictionaryContext>
);

export const useDictionary = () => {
  const dictionary = useContext(DictionaryContext);
  if (!dictionary) throw new Error("useDictionary needs a DictionaryProvider");
  return dictionary;
};

export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
