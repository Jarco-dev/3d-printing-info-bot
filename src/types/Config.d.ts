import { ClientOptions, HexColorString } from "discord.js";

export interface Config {
    COLORS: {
        DEFAULT: HexColorString;
    };
    MSG_TYPES: {
        SUCCESS: { EMOJI: string; COLOR: HexColorString };
        INVALID: { EMOJI: string; COLOR: HexColorString };
        ERROR: { EMOJI: string; COLOR: HexColorString };
        TIME: { EMOJI: string; COLOR: HexColorString };
    };
    CLIENT_OPTIONS: ClientOptions;
    VERSION: string;
}
