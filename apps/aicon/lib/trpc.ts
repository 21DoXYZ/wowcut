"use client";
import { createTRPCReact } from "@trpc/react-query";
import type { AiconRouter } from "@/server/root";

export const trpc = createTRPCReact<AiconRouter>();
