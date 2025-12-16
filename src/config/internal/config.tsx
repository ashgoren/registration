// *********************************************************************************************
// ***                  You shouldn't need to actually modify files in this folder!          ***
// ***                      Configure in user config files in parent folder.                 ***
// *********************************************************************************************

import configEnv from './configEnv';
import configBasics from './configBasics';
import configPaypal from './configPaypal';
import configFields from './configFields';
import configTheme from '../configTheme';
import configOrderSummary from '../configOrderSummary';
import configNavigation from './configNavigation';
import configTieredPricing from '../configTieredPricing';

export const config = {
  ...configEnv,
  ...configBasics,
  paypal: configPaypal,
  fields: configFields,
  theme: configTheme,
  order: configOrderSummary,
  navigation: configNavigation,
  tieredPricing: configTieredPricing,
} as const;
