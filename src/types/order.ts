import { config } from 'config';

export type Order = ReturnType<typeof config.getOrderDefaults>;