export type TimerTaskResult =
    | {
          result: "SUCCESS";
          note?: string;
      }
    | {
          result: "ERRORED";
          note: string;
          error: Error;
      };
