import { SenderMessageOptions, SenderReplyMethod } from "@/types";

export interface SenderReplyOptions extends SenderMessageOptions {
    method?: SenderReplyMethod;
}
