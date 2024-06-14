import type { IStorage } from '@inrupt/solid-client-authn-node';

const internal: { [id: string]: string } = {};
const verbose = false;
export const Storage: IStorage = {
  get: async (key: string) => {
    if (verbose) {
      console.log('Get', key, internal[key]);
    }
    return internal[key];
  },
  set: async (key: string, value: string) => {
    if (verbose) {
      console.log('Set', key, value);
    }
    internal[key] = value;
  },
  delete: async (key: string) => {
    if (verbose) {
      console.log('Delete', key, internal[key]);
    }
    delete internal[key];
  }
};
