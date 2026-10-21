declare global {
	interface NavigatorUAData {
		/** Platform identifier, e.g., 'macOS', 'Windows' */
		platform?: string;
	}
	interface Navigator {
		/** Client Hints API: user agent data */
		userAgentData?: NavigatorUAData;
	}
}

export {};
