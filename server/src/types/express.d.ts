import { JwtAccessPayload } from "./auth.types.js";

declare global {
    namespace Express {
        interface Request {
            user?: JwtAccessPayload;
        }
    }
}