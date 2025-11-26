import { account } from "./account";
import { data } from "./data";
import { gifts } from "./gifts";
import { records } from "./records";
import { settings } from "./settings";
import { sharing } from "./sharing";

export const faqData = [account, records, gifts, data, sharing, settings];

// 型も再エクスポート
export type { FAQItem, FAQCategory } from "../_components/FAQClient";
