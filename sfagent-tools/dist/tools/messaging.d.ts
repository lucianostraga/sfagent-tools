import { z } from 'zod';
export declare const sendMessageSchema: z.ZodObject<{
    sessionId: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    sessionId: string;
}, {
    message: string;
    sessionId: string;
}>;
export declare function sendMessage(args: z.infer<typeof sendMessageSchema>): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
//# sourceMappingURL=messaging.d.ts.map