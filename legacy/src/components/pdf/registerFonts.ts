import { Font } from "@react-pdf/renderer";

// public/fonts/NotoSansJP-VariableFont_wght.ttf を事前に配置しておくこと
Font.register({
	family: "Noto Sans JP",
	src: "/fonts/NotoSansJP-VariableFont_wght.ttf",
});
