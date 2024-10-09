import {
	AndCondition,
	type Condition,
	empty_condition,
	LeafCondition,
	MaxCountCondition,
	OrCondition
} from 'ldes-client';
import type { Path } from './paths';
import { TREE } from '@treecg/types';
import type { Term } from '@rdfjs/types';
export type Cond = {};

export abstract class ConditionFactory {
	protected factories: ConditionFactory[] = [];
	protected conditions: Condition[] = [];

	static Or(): ConditionFactory {
		return new OrConditionFactory();
	}

	static And(): ConditionFactory {
		return new OrConditionFactory();
	}

	limit(amount: number) {
		const condition = new MaxCountCondition({
			count: amount,
			reset_on_poll: true
		});
		this.conditions.push(condition);
	}

	leaf(path: Path, value: Term, relationType?: Term) {
		const condition = new LeafCondition({
			path: path.lens,
			pathQuads: path.quads,
			value,
			relationType: relationType || TREE.terms.EqualToRelation,
			defaultTimezone: 'Z'
		});
		this.conditions.push(condition);
	}

	and() {
		const factory = new AndConditionFactory();
		this.factories.push(factory);
		return factory;
	}

	or() {
		const factory = new OrConditionFactory();
		this.factories.push(factory);
		return factory;
	}

	intoCondition(): Condition {
		const cs = this.conditions.length + this.factories.length;
		if (cs === 0) return empty_condition();
		if (cs === 1) {
			if (this.conditions.length === 1) {
				return this.conditions[0];
			}
			if (this.factories.length === 1) {
				return this.factories[0].intoCondition();
			}
		}
		return this._intoCondition();
	}
	abstract _intoCondition(): Condition;
}

class OrConditionFactory extends ConditionFactory {
	_intoCondition(): Condition {
		const conditions = [...this.conditions, ...this.factories.map((x) => x.intoCondition())];
		return new OrCondition({ items: conditions });
	}
}

class AndConditionFactory extends ConditionFactory {
	_intoCondition(): Condition {
		const conditions = [...this.conditions, ...this.factories.map((x) => x.intoCondition())];
		return new AndCondition({ items: conditions });
	}
}
