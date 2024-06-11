import type { Term } from '@rdfjs/types';
import { createTermNamespace, RDF } from '@treecg/types';
import type { BasicLens, Cont } from 'rdf-lens';
const lens = await import('rdf-lens');

export const Platforms = 'https://heron.libis.be/momu-test/api/items?resource_class_id[]=519';
export const Sensors = 'https://heron.libis.be/momu-test/api/items?resource_class_id[]=525';

export const FIND_ALL =
  'https://heron.libis.be/momu-test/api/items?property[0][joiner]=and&property[0][property][]=1&property[0][type]=in&property[0][text]=node';

const DCTerms = createTermNamespace('http://purl.org/dc/terms/', 'title', 'description');
const SOSA = createTermNamespace('http://www.w3.org/ns/sosa/', 'observes', 'hosts', 'Platform');
const DCType = createTermNamespace('http://purl.org/dc/dcmitype/', 'PhysicalObject');

function field<N extends string>(
  predicate: Term,
  name: N,
  parse?: (id: Term) => string
): BasicLens<Cont, Record<N, string>> {
  return lens
    .pred(predicate)
    .expectOne()
    .map(({ id }) => {
      const out: Record<N, string> = {} as Record<N, string>;
      out[name] = parse ? parse(id) : id.value;
      return out;
    });
}

export type SensorProp = {
  title: string;
  observes: string;
};
export type NodeProp = {
  title: string;
  description: string;
  sensors: SensorProp[];
};

export const SensorLens = field(DCTerms.title, 'title')
  .and(field(SOSA.observes, 'observes'))
  .map((xs) => <SensorProp>Object.assign({}, ...xs));

export const NodeLens = field(DCTerms.title, 'title')
  .and(
    field(DCTerms.description, 'description'),
    lens
      .pred(SOSA.hosts)
      .thenAll(SensorLens)
      .map((sensors) => ({ sensors }))
  )
  .map((xs) => <NodeProp>Object.assign({}, ...xs));

export const PlatformsFromPage = lens
  .match(undefined, RDF.terms.type, SOSA.Platform)
  .thenAll(lens.subject)
  .then(lens.unique())
  .asMulti()
  .thenSome(NodeLens);
