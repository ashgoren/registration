const { VITE_SANDBOX_MODE, VITE_ENV, DEV } = import.meta.env;

export default {
  sandboxMode: VITE_SANDBOX_MODE === 'true',
  env: DEV ? 'dev' : VITE_ENV as 'dev' | 'stg' | 'prd'
};