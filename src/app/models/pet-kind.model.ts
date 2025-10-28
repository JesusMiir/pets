export interface PetKind {
  id: number;
  name: string;
  description?: string;
  icon_url?: string;
  attributes?: Record<string, any>;
}
