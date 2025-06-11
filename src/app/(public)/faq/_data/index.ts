import { account } from "./account";
import { records } from "./records";
import { gifts } from "./gifts";
import { data } from "./data";
import { sharing } from "./sharing";
import { settings } from "./settings";

export const faqData = [account, records, gifts, data, sharing, settings];

// 型も再エクスポート
export type { FAQItem, FAQCategory } from "../_components/FAQClient";
