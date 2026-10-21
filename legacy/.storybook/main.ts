import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: [
		"@storybook/addon-links",
		"@storybook/addon-essentials",
		"@storybook/addon-onboarding",
		"@storybook/addon-interactions",
		"@storybook/addon-a11y",
	],
	framework: {
		name: "@storybook/nextjs",
		options: {},
	},
	docs: {
		autodocs: "tag",
	},
	staticDirs: ["../public"],
	webpackFinal: async (config) => {
		// Node.jsのコアモジュールをモック化
		config.resolve = {
			...config.resolve,
			fallback: {
				...config.resolve?.fallback,
				net: false,
				tls: false,
				dns: false,
				child_process: false,
			},
		};
		return config;
	},
};

export default config;
