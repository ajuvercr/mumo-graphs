import shape from '$lib/configs/shape.ttl?raw';
import type { Measurement } from '$lib/utils';
import { Parser } from 'n3';
import { BasicLens, type Cont, extractShapes } from 'rdf-lens';

function extractShape(turtle: string) {
	const shape_quads = new Parser().parse(turtle);
	const lensCache = extractShapes(shape_quads);
	return lensCache;
}

const shapes = extractShape(shape);
console.log(Object.keys(shapes.lenses));

export const MeasurementLens = <BasicLens<Cont, Measurement>>(
	shapes.lenses['http://example.org/Measurement']
);

export type NodeInstance = {
	id: string;
	time: Date;
	instance: Node;
};
export type Node = {
	title: string;
	id: string;
	euid: string;
	omeka: string;
	hosts: Sensor[];
	parts: Device[];
};
export type Sensor = {
	id: string;
	title: string;
	observes: string;
	omeka: string;
	isPartOf: string;
};
export type Device = {
	id: string;
	title: string;
	publisher: string;
};
export const NodeInstanceLens = <BasicLens<Cont, NodeInstance>>shapes.lenses['NodeInstance'];
