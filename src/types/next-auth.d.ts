import type { DefaultSession } from "next-auth";
import type { UserRoleValue } from "@/lib/domain/revision-workflow";

declare module "next-auth" {
  interface User {
    role: UserRoleValue;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRoleValue;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRoleValue;
  }
}

