import { TREE, XSD } from '@treecg/types';
import {
	AndCondition,
	EmptyCondition,
	LeafCondition,
	OrCondition,
	type Condition
} from 'ldes-client';
import { DataFactory } from 'n3';
import { pred } from 'rdf-lens';
import type { Path } from './paths';

const { namedNode, literal } = DataFactory;

export type MultiParameters = { name: string; value: string }[];
export type MultiValueConstraint = {
	kind: 'multi';
	name: string;
	values: { value: string; name: string }[];
};

// Relation Constraint Parameter Types
export type RelationTypes = { value: string; name: string }[];
export type PropertyTypes = RelationTypes;
export type RelationParameters = {
	relations: RelationTypes;
	properties: PropertyTypes;
};
export type RelationConstraint = {
	kind: 'rel';
	type: { value: string; name: string };
	property: { value: string; name: string };
	value: string;
	choice: 'text' | 'number' | 'date';
};

export const defaultRelations: RelationTypes = [
	{
		name: 'Less Than',
		value: TREE.LessThanRelation
	},
	{
		name: 'Less Than Or Equal',
		value: TREE.LessThanOrEqualToRelation
	},
	{
		name: 'Greater Than',
		value: TREE.GreaterThanRelation
	},
	{
		name: 'Greater Than Or Equal',
		value: TREE.GreaterThanOrEqualToRelation
	}
];

export const defaultProperties: PropertyTypes = [
	{
		name: 'Time',
		value: 'http://def.isotc211.org/iso19156/2011/Observation#OM_Observation.resultTime'
	}
];

export type ListConstraint = {
	kind: 'and' | 'or';
	children: Constraint[];
};

export type Constraint = MultiValueConstraint | ListConstraint | RelationConstraint;

export function isListConstraint(c: Constraint): c is ListConstraint {
	return c.kind === 'and' || c.kind === 'or';
}

export function isMultiConstraint(c: Constraint): c is MultiValueConstraint {
	return c.kind === 'multi';
}

export function isTimeIntervalConstraint(c: Constraint): c is RelationConstraint {
	return c.kind === 'rel';
}

export type Lookup = {
	[type: string]: Path;
};
export function constraintToCondition(c: Constraint, lookup: Lookup): Condition {
	if (isListConstraint(c)) {
		if (c.children.length === 0) return new EmptyCondition();
		const items = c.children.map((x) => constraintToCondition(x, lookup));
		if (c.kind === 'and') {
			return new AndCondition({ items });
		} else {
			return new OrCondition({ items });
		}
	}

	if (isMultiConstraint(c)) {
		const v = lookup[c.name];
		if (v === undefined) {
			console.log('V is undefined', c);
			return new EmptyCondition();
		}
		if (c.values.length === 0) return new EmptyCondition();

		console.log(
			'Setting up multi constrained equal to',
			c.values.map((x) => x.value),
			v.quads
		);
		const items = c.values.map(
			(x) =>
				new LeafCondition({
					relationType: TREE.terms.EqualToRelation,
					path: v.lens,
					pathQuads: v.quads,
					defaultTimezone: 'Z',
					value: namedNode(x.value)
				})
		);

		return new OrCondition({ items });
	}

	if (isTimeIntervalConstraint(c)) {
		if (c.value === undefined || c.property === undefined || c.property === undefined) {
			return new EmptyCondition();
		}
		const path = namedNode(c.property.value);
		const compareType =
			typeof c.value === 'string' ? 'string' : typeof c.value === 'number' ? 'float' : 'date';
		const value =
			typeof c.value === 'string'
				? literal(c.value)
				: typeof c.value === 'number'
					? literal(c.value, XSD.terms.integer)
					: literal(c.value, XSD.terms.dateTime);
		return new LeafCondition({
			relationType: namedNode(c.type.value),
			path: pred(path),
			pathQuads: { entry: path, quads: [] },
			defaultTimezone: 'Z',
			value,
			compareType
		});
	}

	return new EmptyCondition();
}
