import jsonld from 'jsonld';
import { Parser } from 'n3';

export async function jsonld_to_quads(ld: string) {
	const nquads = await jsonld.toRDF(JSON.parse(ld), {
		format: 'application/n-quads'
	});
	const quads = new Parser().parse(nquads);
	return quads;
}
