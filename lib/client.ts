import { createThirdwebClient } from "thirdweb";

/**
 * thirdweb client instance
 * Used for wallet connection and contract interactions
 */
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "demo-client-id",
});
