"use client";
import { createContext, useContext } from "react";

export type NavigationMode = "global" | "detail" | "none";

const NavigationModeContext = createContext<NavigationMode>("global");

export const NavigationModeProvider = NavigationModeContext.Provider;

export function useNavigationMode(): NavigationMode {
	return useContext(NavigationModeContext);
}
