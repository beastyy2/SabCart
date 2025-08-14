import { serve } from "inngest/next";
import { createUserOder, inngest, syncUserCreation, syncUserDeletion} from "@/config/inngest";


export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
   syncUserCreation,
   syncUserDeletion,
   createUserOder
  ],
});