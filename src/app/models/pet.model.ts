// This is not used because I think this approach allows the API to adapt better.
// It will be developed in the next version of the app.
import { PetKind } from './pet-kind.model';

export interface Pet {
  id: number;
  name: string;
  kind: 'dog' | 'cat' | string;
  weight: number; // grams
  height: number; // cm
  length: number; // cm
  photo_url: string;
  description?: string;
  number_of_lives?: number; // cats only
}
