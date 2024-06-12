import { NamedNode, Parser } from 'n3';
import paths from './configs/paths.ttl?raw';
import { BasicLensM, type Cont, extractShapes } from 'rdf-lens';
import type { Quad, Term } from '@rdfjs/types';

const quads = new Parser().parse(paths);

const lens = extractShapes(quads);
console.log(Object.keys(lens.lenses));

export type RdfThing = {
  entry: Term;
  quads: Quad[];
};
export type Path = {
  lens: BasicLensM<Cont, Cont>;
  quads: RdfThing;
};

export const Location: Path = lens.lenses['http://example.org/Path'].execute({
  quads,
  id: new NamedNode('http://example.org/location')
});

export const Node: Path = lens.lenses['http://example.org/Path'].execute({
  quads,
  id: new NamedNode('http://example.org/node')
});

export const Sensor: Path = lens.lenses['http://example.org/Path'].execute({
  quads,
  id: new NamedNode('http://example.org/sensor')
});
