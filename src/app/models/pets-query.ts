export type PetsQuery = {
  sortBy?: 'weight' | 'length' | 'height' | 'name' | 'kind';
  sortOrder?: 'asc' | 'desc';

  kind?: 'dog' | 'cat' | '';
  nameLike?: string;

  page?: number;
  limit?: number;
};
