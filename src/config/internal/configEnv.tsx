const { VITE_SANDBOX_MODE, VITE_ENV, DEV } = import.meta.env;

type EnvType = 'dev' | 'stg' | 'prd';

const envConfig = {
  SANDBOX_MODE: VITE_SANDBOX_MODE === 'true',
  ENV: DEV ? 'dev' : VITE_ENV as EnvType
};

export default envConfig;
