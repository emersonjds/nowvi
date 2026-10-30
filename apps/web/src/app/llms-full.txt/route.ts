import { llmsFullTxt, textResponse } from "@/lib/llms-txt";

export const dynamic = "force-static";

export const GET = () => textResponse(llmsFullTxt());
