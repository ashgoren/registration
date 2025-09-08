const { VITE_SANDBOX_MODE, VITE_ENV, DEV } = import.meta.env;

const envConfig = {
  SANDBOX_MODE: VITE_SANDBOX_MODE === 'true',
  ENV: DEV ? 'dev' : VITE_ENV
};

export default envConfig;
