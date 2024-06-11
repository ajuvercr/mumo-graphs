export type Property =
	| {
			property_label: string;
	  }
	| {};

export type Value =
	| string
	| { '@id': string; display_title?: string }
	| {
			'@value': string;
	  };

export type JsonObjectValue = string | Array<Value & Property>;
export type JsonObject = { [label: string]: JsonObjectValue };
