import { z } from 'zod';
export declare const loadConfigSchema: z.ZodObject<{
    configPath: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    configPath?: string | undefined;
}, {
    configPath?: string | undefined;
}>;
export declare function loadConfig(args: z.infer<typeof loadConfigSchema>): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=config.d.ts.map