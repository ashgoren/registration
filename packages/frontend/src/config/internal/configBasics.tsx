import { fromZonedTime } from 'date-fns-tz';
import configEvent from '../configEvent';
import type { PaymentMethod, AdmissionMode } from '@registration/types';

const { productionMode, event, staticPages, registration, nametags, admissions, payments, contacts, links, calendar } = configEvent;

const costDefaultMapping: Record<AdmissionMode, number> = {
  'sliding-scale': admissions.slidingScale.costDefault,
  'fixed': admissions.fixed.cost,
  'tiered': admissions.slidingScale.costDefault // default for tiered is ignored; actual default is set in PersonForm#saveUpdatedOrder
};

const costRangeMapping: Record<AdmissionMode, [number, number]> = {
  'sliding-scale': admissions.slidingScale.costRange as [number, number],
  'fixed': [admissions.fixed.cost, admissions.fixed.cost],
  'tiered': [0, 999]
};

const baseConfig = {
  productionMode,
  event,
  contacts,
  links,
  calendar,
  nametags,
  staticPages,
  registration,
  registrationOnly: staticPages.enabled === false,
  payments: {
    ...payments,
    methods: payments.checks.allowed ? [payments.processor as PaymentMethod, 'check' as PaymentMethod] : [payments.processor as PaymentMethod],
  },
  admissions: {
    mode: admissions.mode,
    costRange: costRangeMapping[admissions.mode as AdmissionMode],
    costDefault: costDefaultMapping[admissions.mode as AdmissionMode],
    fixedCost: admissions.fixed.cost,
    earlybirdCutoff: fromZonedTime(`${admissions.tiered.earlybirdCutoff}T23:59:59.999`, event.timezone),
  },
} as const;

export default baseConfig;
