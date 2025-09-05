const { VITE_SANDBOX_MODE } = import.meta.env;

const envConfig = {
  SANDBOX_MODE: VITE_SANDBOX_MODE === 'true'
};

export default envConfig;
