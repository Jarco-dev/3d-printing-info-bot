export type HandlerResult =
    | {
          result:
              | "SUCCESS"
              | "INVALID_ARGUMENTS"
              | "USER_MISSING_PERMISSIONS"
              | "OTHER";
          note?: string;
      }
    | {
          result: "ERRORED";
          note: string;
          error: Error;
      };
