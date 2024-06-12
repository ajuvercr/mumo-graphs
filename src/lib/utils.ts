import jsonld from 'jsonld';
import { Parser, type Term } from 'n3';

export type Object = {
  id: Term;
  name: string;
};

export type Measurement = {
  result: {
    numericValue: number;
    valueType: string;
  };
  date: Date;
  sensor: Object;
  node: Object;
};

export async function jsonld_to_quads(ld: string) {
  const nquads = await jsonld.toRDF(JSON.parse(ld), {
    format: 'application/n-quads'
  });
  const quads = new Parser().parse(nquads);
  return quads;
}

export async function myFetch(a: Parameters<typeof fetch>[0], b: Parameters<typeof fetch>[1]) {
  try {
    const resp = await fetch(a, b);
    return resp;
  } catch (ex: unknown) {
    console.log('fetch failed');
    return new Response('', {
      status: 200
    });
  }
}
