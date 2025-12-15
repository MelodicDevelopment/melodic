export type GuardResult = boolean | string;
export type AsyncGuardResult = GuardResult | Promise<GuardResult>;
