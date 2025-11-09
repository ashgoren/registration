// *********************************************************************************************
// ***                  You shouldn't need to actually modify files in this folder!          ***
// ***                      Configure in user config files in parent folder.                 ***
// *********************************************************************************************

import configEnv from './configEnv';
import configSystem from './configSystem';
import configPaypal from './configPaypal';
import configBasics from './configBasics';
import configFields from './configFields';
import configTheme from '../configTheme';
import configOrderSummary from '../configOrderSummary';

export const config = {
  ...configEnv,
  ...configSystem,
  ...configPaypal,
  ...configBasics,
  ...configFields,
  ...configTheme,
  ...configOrderSummary
} as const;
