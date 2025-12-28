import configBasics from 'config/internal/configBasics';
import type { AgeGroup } from '@registration/types';

type PricingOption = {
  early: number;
  later: number;
  category?: string;
};

type TieredPricingEntry = {
  ageLabel: string;
  options: PricingOption[];
};

const tieredPricingMap: Record<AgeGroup, TieredPricingEntry> = {
  '0-2': {
    ageLabel: '0-2 yr old',
    options: [
      { early: 0, later: 0 }
    ]
  },
  '3-5': {
    ageLabel: '3-5 yr old',
    options: [
      { early: 105, later: 120 }
    ]
  },
  '6-12': {
    ageLabel: '6-12 yr old',
    options: [
      { early: 160, later: 175  }
    ]
  },
  '13-17': {
    ageLabel: '13-17 yr old',
    options: [
      { early: 220, later: 235, category: 'Sustaining' },
      { early: 160, later: 175, category: 'Basic' }
    ]
  },
  'adult': {
    ageLabel: 'Adult (18+)',
    options: [
      { early: 340, later: 355, category: 'Benefactor' },
      { early: 280, later: 295, category: 'Sustaining' },
      { early: 220, later: 235, category: 'Basic' }
    ]
  },
} as const;

const getTier = () => new Date() <= configBasics.admissions.earlybirdCutoff ? 'early' : 'later';

const getDefaultAdmission = (person: { age: AgeGroup }) => {
  if (!person.age || !tieredPricingMap[person.age]) {
    throw new Error(`Invalid age group: ${person.age}`);
  }
  const tier = getTier();
  const admissionOptions = tieredPricingMap[person.age].options;
  const admissionOption = admissionOptions.find(option => option.category === 'Sustaining') || admissionOptions[0];
  return admissionOption[tier];
};

const getCategoryLabel = (person: { age: AgeGroup }) => tieredPricingMap[person.age].ageLabel;

const getOptions = (person: { age: AgeGroup }) => {
  const tier = getTier();
  return tieredPricingMap[person.age].options.map(option => ({
    label: option.category ? `${option.category} - $${option[tier]}` : `$${option[tier]}`,
    value: option[tier]
  }));
};

export default {
  getDefaultAdmission,
  getCategoryLabel,
  getOptions
};